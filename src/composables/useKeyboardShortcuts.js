import { onMounted, onUnmounted } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'
import { useSegmentStore } from '@/stores/segmentStore.js'

/**
 * Register global keyboard shortcuts for video editing.
 * Must be called inside a component's setup().
 *
 * Shortcuts:
 *   Space            — toggle play/pause
 *   I                — mark in point
 *   O / E            — mark out point (creates segment)
 *   ArrowLeft        — step back one frame
 *   ArrowRight       — step forward one frame
 *   Ctrl+ArrowLeft   — seek back 10 seconds
 *   Ctrl+ArrowRight  — seek forward 10 seconds
 *   Shift+ArrowLeft  — seek back 60 seconds
 *   Shift+ArrowRight — seek forward 60 seconds
 *   ,                — step back (prev frame alias)
 *   .                — step forward (next frame alias)
 *   M                — toggle mute
 *   Delete/Backspace — delete selected segment
 *
 * @param {object} opts
 * @param {function} opts.togglePlay
 * @param {function} opts.stepFrame  - (dir: number) => void
 */
export function useKeyboardShortcuts({ togglePlay, stepFrame }) {
  const videoStore = useVideoStore()
  const segmentStore = useSegmentStore()

  function onKeyDown(e) {
    // Skip when focused in an input, textarea, or contenteditable
    const tag = e.target?.tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return

    switch (e.code) {
      case 'Space':
        e.preventDefault()
        if (videoStore.hasFile) togglePlay()
        break

      case 'KeyI':
        e.preventDefault()
        if (videoStore.hasFile) segmentStore.markIn(videoStore.currentTime)
        break

      case 'KeyO':
      case 'KeyE':
        e.preventDefault()
        if (videoStore.hasFile) segmentStore.markOut(videoStore.currentTime)
        break

      case 'ArrowLeft':
        e.preventDefault()
        if (!videoStore.hasFile) break
        if (e.shiftKey) {
          videoStore.setCurrentTime(videoStore.currentTime - 60)
        } else if (e.ctrlKey) {
          videoStore.setCurrentTime(videoStore.currentTime - 10)
        } else {
          stepFrame(-1)
        }
        break

      case 'ArrowRight':
        e.preventDefault()
        if (!videoStore.hasFile) break
        if (e.shiftKey) {
          videoStore.setCurrentTime(videoStore.currentTime + 60)
        } else if (e.ctrlKey) {
          videoStore.setCurrentTime(videoStore.currentTime + 10)
        } else {
          stepFrame(1)
        }
        break

      case 'Comma':
        e.preventDefault()
        if (videoStore.hasFile) stepFrame(-1)
        break

      case 'Period':
        e.preventDefault()
        if (videoStore.hasFile) stepFrame(1)
        break

      case 'KeyM':
        e.preventDefault()
        if (videoStore.hasFile) videoStore.toggleMute()
        break

      case 'Delete':
      case 'Backspace':
        if (segmentStore.selectedId) {
          e.preventDefault()
          segmentStore.removeSegment(segmentStore.selectedId)
        }
        break

      default:
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
