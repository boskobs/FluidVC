import { spawn, execFileSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { buildSegmentCutArgs, buildConcatFileContent, buildMetadataFileContent } from './ffmpegArgs.js'

// Resolve ffmpeg / ffprobe binaries.
// Priority:
//   1. process.resourcesPath (extraResources in packaged app)
//   2. APP_ROOT/resources/ (dev mode project folder)
//   3. System PATH
function resolveBinary(name) {
  const exeName = process.platform === 'win32' ? `${name}.exe` : name

  // 1. Packaged: extraResources copies binaries next to the asar
  const resourceBin = path.join(process.resourcesPath, exeName)
  if (fs.existsSync(resourceBin)) return resourceBin

  // 2. Dev: APP_ROOT/resources/ in project root
  if (process.env.APP_ROOT) {
    const devBin = path.join(process.env.APP_ROOT, 'resources', exeName)
    if (fs.existsSync(devBin)) return devBin
  }

  // 3. System PATH
  const which = process.platform === 'win32' ? 'where' : 'which'
  try {
    const result = execFileSync(which, [name], { encoding: 'utf8' }).trim().split('\n')[0].trim()
    if (result && fs.existsSync(result)) return result
  } catch {}

  throw new Error(`Could not find binary: ${exeName}`)
}

let ffmpegPath = null
let ffprobePath = null

function ensurePaths() {
  if (!ffmpegPath) ffmpegPath = resolveBinary('ffmpeg')
  if (!ffprobePath) ffprobePath = resolveBinary('ffprobe')
}

// Single in-flight process reference for cancellation
let activeProcess = null

/**
 * Get video metadata using ffprobe
 * @param {string} filePath
 * @returns {Promise<object>}
 */
export function getVideoMetadata(filePath) {
  ensurePaths()
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ]
    let output = ''
    const proc = spawn(ffprobePath, args)
    proc.stdout.on('data', (d) => { output += d.toString() })
    proc.stderr.on('data', () => {}) // suppress
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}`))
        return
      }
      try {
        const json = JSON.parse(output)
        const videoStream = json.streams.find((s) => s.codec_type === 'video')
        const format = json.format
        const parseFps = (str) => {
          const [n, d] = (str || '30/1').split('/').map(Number)
          return d > 0 ? n / d : n || 30
        }
        const fps = videoStream ? parseFps(videoStream.r_frame_rate) : 0
        resolve({
          path: filePath,
          name: path.basename(filePath),
          duration: parseFloat(format.duration || 0),
          width: videoStream ? videoStream.width : 0,
          height: videoStream ? videoStream.height : 0,
          fps: Math.round(fps * 100) / 100,
          codec: videoStream ? videoStream.codec_name : 'unknown',
          size: parseInt(format.size || 0),
        })
      } catch (e) {
        reject(e)
      }
    })
    proc.on('error', reject)
  })
}

/**
 * Export video segments
 * @param {object} opts
 * @param {string} opts.inputPath
 * @param {Array} opts.segments - enabled segments [{id, name, startTime, endTime}]
 * @param {string} opts.outputPath
 * @param {'copy'|'reencode'} opts.mode
 * @param {string} [opts.codec] - e.g. 'libx264'
 * @param {number} [opts.crf] - e.g. 23
 * @param {function} opts.onProgress - callback({phase, segmentIndex, totalSegments, percent, message})
 * @returns {Promise<void>}
 */
export async function exportVideo(opts) {
  ensurePaths()
  const { inputPath, segments, outputPath, mode, codec, crf, onProgress } = opts
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fluidvc-'))
  const tempFiles = []
  const actualDurations = [] // real durations after keyframe-snapped cuts

  try {
    // Phase 1: Cut each segment
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      const tempOut = path.join(tempDir, `seg_${i}${path.extname(outputPath) || '.mp4'}`)
      tempFiles.push(tempOut)

      onProgress({
        phase: 'cutting',
        segmentIndex: i,
        totalSegments: segments.length,
        percent: Math.round((i / (segments.length + 1)) * 90),
        message: `Cutting segment ${i + 1} of ${segments.length}…`,
      })

      const args = buildSegmentCutArgs({
        inputPath,
        startTime: seg.startTime,
        endTime: seg.endTime,
        outputPath: tempOut,
        mode,
        codec: codec || 'libx264',
        crf: crf ?? 23,
      })

      await runFfmpeg(args, (progress) => {
        const segDur = seg.endTime - seg.startTime
        const subPct = segDur > 0 ? Math.min(progress / segDur, 1) : 0
        const overallPct = Math.round(((i + subPct) / (segments.length + 1)) * 90)
        onProgress({
          phase: 'cutting',
          segmentIndex: i,
          totalSegments: segments.length,
          percent: overallPct,
          message: `Cutting segment ${i + 1} of ${segments.length}…`,
        })
      })

      // In copy mode FFmpeg snaps to the nearest keyframe, so the actual output
      // duration may differ from (endTime - startTime). Probe the real duration
      // so chapter timestamps stay accurate.
      if (mode === 'copy') {
        actualDurations.push(await getFileDuration(tempOut))
      } else {
        actualDurations.push(seg.endTime - seg.startTime)
      }
    }

    // Phase 2: Write concat list
    const concatFile = path.join(tempDir, 'concat.txt')
    fs.writeFileSync(concatFile, buildConcatFileContent(tempFiles))

    // Phase 3: Write metadata if any segments are named.
    // Use actualDurations (probed from the cut files) so chapters align with the
    // real keyframe-snapped boundaries rather than the requested times.
    const hasChapters = segments.some((s) => s.name && s.name.trim())
    let metaFile = null
    if (hasChapters) {
      const segmentsWithActualDurations = segments.map((seg, i) => ({
        ...seg,
        endTime: seg.startTime + actualDurations[i],
      }))
      metaFile = path.join(tempDir, 'metadata.txt')
      fs.writeFileSync(metaFile, buildMetadataFileContent(segmentsWithActualDurations))
    }

    onProgress({
      phase: 'merging',
      segmentIndex: segments.length,
      totalSegments: segments.length,
      percent: 92,
      message: 'Merging segments…',
    })

    // Phase 4: Concat
    const concatArgs = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFile,
    ]
    if (metaFile) {
      concatArgs.push('-i', metaFile, '-map_metadata', '1')
    }
    concatArgs.push('-c', 'copy', outputPath)

    await runFfmpeg(concatArgs, () => {
      onProgress({
        phase: 'merging',
        segmentIndex: segments.length,
        totalSegments: segments.length,
        percent: 97,
        message: 'Finalising output…',
      })
    })

    onProgress({
      phase: 'done',
      segmentIndex: segments.length,
      totalSegments: segments.length,
      percent: 100,
      message: 'Export complete!',
    })
  } finally {
    // Cleanup temp files
    for (const f of tempFiles) {
      try { fs.unlinkSync(f) } catch {}
    }
    try { fs.rmdirSync(tempDir, { recursive: true }) } catch {}
  }
}

function runFfmpeg(args, onTime) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args)
    activeProcess = proc

    let stderr = ''
    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      stderr += text
      // Parse time= from ffmpeg progress output
      const m = text.match(/time=(\d+):(\d+):(\d+\.\d+)/)
      if (m) {
        const seconds = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3])
        onTime(seconds)
      }
    })

    proc.on('close', (code) => {
      activeProcess = null
      if (code === 0 || code === null) {
        resolve()
      } else {
        reject(new Error(`FFmpeg exited with code ${code}\n${stderr.slice(-1000)}`))
      }
    })

    proc.on('error', (err) => {
      activeProcess = null
      reject(err)
    })
  })
}

export function cancelExport() {
  if (activeProcess) {
    activeProcess.kill('SIGKILL')
    activeProcess = null
  }
}

/**
 * Probe the actual duration of a file using ffprobe.
 * Used after copy-mode cuts to get the real (keyframe-snapped) duration.
 * @param {string} filePath
 * @returns {Promise<number>} duration in seconds
 */
function getFileDuration(filePath) {
  ensurePaths()
  return new Promise((resolve) => {
    const args = ['-v', 'quiet', '-print_format', 'json', '-show_format', filePath]
    let out = ''
    const proc = spawn(ffprobePath, args)
    proc.stdout.on('data', (d) => { out += d.toString() })
    proc.stderr.on('data', () => {})
    proc.on('close', () => {
      try {
        const json = JSON.parse(out)
        resolve(parseFloat(json.format?.duration || 0))
      } catch {
        resolve(0)
      }
    })
    proc.on('error', () => resolve(0))
  })
}
