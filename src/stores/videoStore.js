import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVideoStore = defineStore('video', () => {
  /** @type {import('vue').Ref<{path:string,name:string,duration:number,width:number,height:number,fps:number,codec:string,size:number}|null>} */
  const file = ref(null)
  const currentTime = ref(0)
  const isPlaying = ref(false)
  const volume = ref(1)
  const isMuted = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  const hasFile = computed(() => file.value !== null)
  const duration = computed(() => file.value?.duration ?? 0)
  const progress = computed(() =>
    duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0,
  )

  /**
   * Open the native file dialog and load a video.
   * Calls window.api (preload bridge).
   */
  async function loadFile() {
    isLoading.value = true
    error.value = null
    try {
      const metadata = await window.api.openVideoFile()
      if (metadata) {
        file.value = metadata
        currentTime.value = 0
        isPlaying.value = false
      }
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load a file from a given path (e.g. drag-drop gave us the path directly).
   * @param {string} filePath
   */
  async function loadFilePath(filePath) {
    isLoading.value = true
    error.value = null
    try {
      const metadata = await window.api.getVideoMetadata(filePath)
      if (metadata) {
        file.value = metadata
        currentTime.value = 0
        isPlaying.value = false
      }
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  function setCurrentTime(t) {
    currentTime.value = Math.max(0, Math.min(t, duration.value))
  }

  function setPlaying(val) {
    isPlaying.value = val
  }

  function setVolume(val) {
    volume.value = Math.max(0, Math.min(1, val))
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
  }

  function unloadFile() {
    file.value = null
    currentTime.value = 0
    isPlaying.value = false
    error.value = null
  }

  return {
    file,
    currentTime,
    isPlaying,
    volume,
    isMuted,
    isLoading,
    error,
    hasFile,
    duration,
    progress,
    loadFile,
    loadFilePath,
    setCurrentTime,
    setPlaying,
    setVolume,
    toggleMute,
    unloadFile,
  }
})
