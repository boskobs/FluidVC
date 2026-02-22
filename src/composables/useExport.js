import { ref, computed } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'
import { useSegmentStore } from '@/stores/segmentStore.js'

/**
 * Composable for managing the video export flow.
 */
export function useExport() {
  const videoStore = useVideoStore()
  const segmentStore = useSegmentStore()

  const isExporting = ref(false)
  const exportDone = ref(false)
  const exportError = ref(null)
  const progress = ref({
    phase: 'idle',
    segmentIndex: 0,
    totalSegments: 0,
    percent: 0,
    message: '',
  })

  let unsubscribeProgress = null

  const canExport = computed(
    () => videoStore.hasFile && segmentStore.canExport && !isExporting.value,
  )

  /**
   * Start export.
   * @param {object} opts
   * @param {string} opts.outputPath
   * @param {'copy'|'reencode'} opts.mode
   * @param {string} [opts.codec]
   * @param {number} [opts.crf]
   */
  async function start(opts) {
    if (!canExport.value) return

    isExporting.value = true
    exportDone.value = false
    exportError.value = null
    progress.value = {
      phase: 'starting',
      segmentIndex: 0,
      totalSegments: segmentStore.enabledSegments.length,
      percent: 0,
      message: 'Starting export…',
    }

    // Subscribe to progress events from main process
    unsubscribeProgress = window.api.onExportProgress((data) => {
      progress.value = data
    })

    try {
      const result = await window.api.exportVideo({
        inputPath: videoStore.file.path,
        segments: segmentStore.enabledSegments.map((s) => ({
          id: s.id,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        outputPath: opts.outputPath,
        mode: opts.mode,
        codec: opts.codec,
        crf: opts.crf,
      })

      if (result.success) {
        exportDone.value = true
        progress.value = {
          phase: 'done',
          segmentIndex: segmentStore.enabledSegments.length,
          totalSegments: segmentStore.enabledSegments.length,
          percent: 100,
          message: 'Export complete!',
        }
      } else {
        exportError.value = result.error
        progress.value = { ...progress.value, phase: 'error', message: result.error }
      }
    } catch (e) {
      exportError.value = e.message
      progress.value = { ...progress.value, phase: 'error', message: e.message }
    } finally {
      isExporting.value = false
      if (unsubscribeProgress) {
        unsubscribeProgress()
        unsubscribeProgress = null
      }
    }
  }

  async function cancel() {
    if (!isExporting.value) return
    await window.api.cancelExport()
    isExporting.value = false
    progress.value = { ...progress.value, phase: 'cancelled', message: 'Export cancelled.' }
    if (unsubscribeProgress) {
      unsubscribeProgress()
      unsubscribeProgress = null
    }
  }

  function reset() {
    isExporting.value = false
    exportDone.value = false
    exportError.value = null
    progress.value = { phase: 'idle', segmentIndex: 0, totalSegments: 0, percent: 0, message: '' }
  }

  return { isExporting, exportDone, exportError, progress, canExport, start, cancel, reset }
}
