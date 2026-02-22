<template>
  <div class="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-lg">
    <video
      ref="videoRef"
      class="max-w-full max-h-full object-contain cursor-pointer"
      :src="videoSrc"
      preload="metadata"
      @loadedmetadata="onLoaded"
      @error="onVideoError"
      @click="togglePlay"
    />

    <!-- Loading overlay -->
    <div
      v-if="videoStore.isLoading"
      class="absolute inset-0 flex items-center justify-center bg-black/60"
    >
      <span class="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Error overlay -->
    <div
      v-if="videoStore.error"
      class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80"
    >
      <svg class="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p class="text-sm text-danger">Failed to load video</p>
      <p class="text-xs text-gray-500 max-w-xs text-center">{{ videoStore.error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'
import { useVideoPlayer } from '@/composables/useVideoPlayer.js'

const videoStore = useVideoStore()
const videoRef = ref(null)

// Expose player controls to parent via defineExpose
const { play, pause, togglePlay, seek, stepFrame } = useVideoPlayer(videoRef)
defineExpose({ play, pause, togglePlay, seek, stepFrame, videoRef })

// Build a file:// URL for the local video.
// webSecurity is disabled in main.js so file:// loads work from the HTTP renderer origin.
const videoSrc = computed(() => {
  if (!videoStore.file?.path) return ''
  // Normalize Windows backslashes to forward slashes.
  const normalized = videoStore.file.path.replace(/\\/g, '/')
  // Encode each segment for spaces/special chars, but leave Windows drive letters (e.g. "C:") intact.
  const encoded = normalized.split('/').map((seg, i) => {
    if (i === 0 && /^[a-zA-Z]:$/.test(seg)) return seg  // Windows drive letter
    return encodeURIComponent(seg)
  }).join('/')
  // Unix paths start with / → encoded="/home/..." → "file:///home/..."
  // Windows paths start with drive letter → encoded="C:/..." → "file:///C:/..."
  return (encoded.startsWith('/') ? 'file://' : 'file:///') + encoded
})

function onVideoError() {
  const el = videoRef.value
  if (!el) return
  const code = el.error?.code
  const msgs = {
    1: 'Playback aborted',
    2: 'Network error loading video',
    3: 'Video decode error',
    4: `Format not supported (src: ${el.currentSrc})`,
  }
  videoStore.error = msgs[code] ?? `Video error (code ${code})`
}

function onLoaded() {
  if (videoRef.value) {
    videoRef.value.volume = videoStore.volume
  }
}

// When file changes, reset to start
watch(
  () => videoStore.file?.path,
  () => {
    if (videoRef.value) {
      videoRef.value.currentTime = 0
    }
  },
)

// Sync currentTime changes from store (e.g. segment click → seek)
watch(
  () => videoStore.currentTime,
  (t) => {
    if (!videoRef.value) return
    if (Math.abs(videoRef.value.currentTime - t) > 0.1) {
      videoRef.value.currentTime = t
    }
  },
)
</script>
