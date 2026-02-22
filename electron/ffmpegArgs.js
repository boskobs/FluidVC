/**
 * Build FFmpeg arguments to cut a single segment from the source video.
 */
export function buildSegmentCutArgs({ inputPath, startTime, endTime, outputPath, mode, codec, crf }) {
  if (mode === 'copy') {
    return [
      '-ss', String(startTime),
      '-to', String(endTime),
      '-i', inputPath,
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      outputPath,
    ]
  }
  // Re-encode mode: seek before input for accuracy
  return [
    '-ss', String(startTime),
    '-to', String(endTime),
    '-i', inputPath,
    '-c:v', codec || 'libx264',
    '-crf', String(crf ?? 23),
    '-preset', 'medium',
    '-c:a', 'aac',
    '-b:a', '192k',
    outputPath,
  ]
}

/**
 * Build content for an ffmpeg concat list file.
 * @param {string[]} filePaths - absolute paths to temp segment files
 * @returns {string}
 */
export function buildConcatFileContent(filePaths) {
  return filePaths
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join('\n')
}

/**
 * Build FFMETADATA file content for named chapters.
 * @param {Array<{name:string, startTime:number, endTime:number}>} segments
 * @returns {string}
 */
export function buildMetadataFileContent(segments) {
  let lines = [';FFMETADATA1', '']
  let cursor = 0
  for (const seg of segments) {
    const dur = seg.endTime - seg.startTime
    const start = Math.round(cursor * 1000)
    const end = Math.round((cursor + dur) * 1000)
    lines.push('[CHAPTER]')
    lines.push('TIMEBASE=1/1000')
    lines.push(`START=${start}`)
    lines.push(`END=${end}`)
    if (seg.name && seg.name.trim()) {
      lines.push(`title=${seg.name.trim()}`)
    }
    lines.push('')
    cursor += dur
  }
  return lines.join('\n')
}
