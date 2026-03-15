import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSegmentStore } from './segmentStore.js'

export const useVideoStore = defineStore('video', () => {
  /** @type {import('vue').Ref<{path:string,name:string,duration:number,width:number,height:number,fps:number,codec:string,size:number}|null>} */
  const file = ref(null)
  const currentTime = ref(0)
  const isPlaying = ref(false)
  const volume = ref(1)
  const isMuted = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  // Proxy state — used when the original codec isn't playable by Chromium
  const proxyPath = ref(null)
  const isCreatingProxy = ref(false)

  /**
   * Codecs that Chromium can play natively without a proxy.
   */
  const BROWSER_COMPATIBLE_CODECS = new Set(['h264', 'avc1', 'vp8', 'vp9', 'av1', 'theora'])

  /**
   * The path that should be used as the video element source.
   * Returns null while a proxy is being created (hides the element to avoid
   * a flash of error), the proxy path once ready, or the original path.
   */
  const sourcePath = computed(() => {
    if (isCreatingProxy.value) return null
    return proxyPath.value ?? file.value?.path ?? null
  })

  const hasFile = computed(() => file.value !== null)
  const duration = computed(() => file.value?.duration ?? 0)
  const progress = computed(() =>
    duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0,
  )

  /**
   * Kick off proxy creation for the currently loaded file.
   * Safe to call multiple times — ignores duplicate calls.
   */
  async function createProxy() {
    if (!file.value || isCreatingProxy.value || proxyPath.value) return
    isCreatingProxy.value = true
    error.value = null
    try {
      const result = await window.api.createProxyVideo(file.value.path)
      if (result.success) {
        proxyPath.value = result.proxyPath
      } else {
        error.value = `Could not create proxy: ${result.error}`
      }
    } catch (e) {
      error.value = e.message
    } finally {
      isCreatingProxy.value = false
    }
  }

  /**
   * After metadata is loaded, automatically start proxy creation if needed.
   * @param {{ codec: string }} metadata
   */
  function maybeCreateProxy(metadata) {
    if (metadata && !BROWSER_COMPATIBLE_CODECS.has((metadata.codec || '').toLowerCase())) {
      createProxy()
    }
  }

  /**
   * Open the native file dialog and load a video.
   * Calls window.api (preload bridge).
   */
  async function loadFile() {
    isLoading.value = true
    error.value = null
    proxyPath.value = null
    isCreatingProxy.value = false
    try {
      const metadata = await window.api.openVideoFile()
      if (metadata) {
        file.value = metadata
        currentTime.value = 0
        isPlaying.value = false
        maybeCreateProxy(metadata)
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
    proxyPath.value = null
    isCreatingProxy.value = false
    try {
      const metadata = await window.api.getVideoMetadata(filePath)
      if (metadata) {
        file.value = metadata
        currentTime.value = 0
        isPlaying.value = false
        maybeCreateProxy(metadata)
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
    volume.value = 1
    isMuted.value = false
    error.value = null
    proxyPath.value = null
    isCreatingProxy.value = false
    useSegmentStore().clearAll()
  }

  return {
    file,
    currentTime,
    isPlaying,
    volume,
    isMuted,
    isLoading,
    error,
    proxyPath,
    isCreatingProxy,
    sourcePath,
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
    createProxy,
  }
})
