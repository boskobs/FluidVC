import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'

/**
 * Wraps an HTML <video> element ref and syncs state with videoStore.
 * @param {import('vue').Ref<HTMLVideoElement|null>} videoRef
 * @returns {object}
 */
export function useVideoPlayer(videoRef) {
  const store = useVideoStore()
  let rafId = null

  function startRaf() {
    if (rafId !== null) return
    const tick = () => {
      if (videoRef.value && !videoRef.value.paused) {
        store.setCurrentTime(videoRef.value.currentTime)
        rafId = requestAnimationFrame(tick)
      } else {
        rafId = null
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  function stopRaf() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function play() {
    videoRef.value?.play()
  }

  function pause() {
    videoRef.value?.pause()
  }

  function togglePlay() {
    if (!videoRef.value) return
    if (videoRef.value.paused) {
      play()
    } else {
      pause()
    }
  }

  function seek(time) {
    if (!videoRef.value) return
    videoRef.value.currentTime = Math.max(0, Math.min(time, videoRef.value.duration || 0))
    store.setCurrentTime(videoRef.value.currentTime)
  }

  function stepFrame(direction = 1) {
    if (!videoRef.value) return
    const fps = store.file?.fps || 30
    const step = direction / fps
    seek(store.currentTime + step)
  }

  function onPlay() {
    store.setPlaying(true)
    startRaf()
  }

  function onPause() {
    store.setPlaying(false)
    stopRaf()
    if (videoRef.value) {
      store.setCurrentTime(videoRef.value.currentTime)
    }
  }

  function onTimeUpdate() {
    if (videoRef.value && videoRef.value.paused) {
      store.setCurrentTime(videoRef.value.currentTime)
    }
  }

  function onEnded() {
    store.setPlaying(false)
    stopRaf()
  }

  function attachEvents() {
    const el = videoRef.value
    if (!el) return
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('ended', onEnded)
  }

  function detachEvents() {
    const el = videoRef.value
    if (!el) return
    el.removeEventListener('play', onPlay)
    el.removeEventListener('pause', onPause)
    el.removeEventListener('timeupdate', onTimeUpdate)
    el.removeEventListener('ended', onEnded)
  }

  // Sync store volume to video element
  watch(
    () => store.volume,
    (v) => { if (videoRef.value) videoRef.value.volume = v },
  )

  watch(
    () => store.isMuted,
    (v) => { if (videoRef.value) videoRef.value.muted = v },
  )

  onMounted(() => {
    if (videoRef.value) attachEvents()
  })

  onUnmounted(() => {
    detachEvents()
    stopRaf()
  })

  return { play, pause, togglePlay, seek, stepFrame }
}
