<template>
  <header class="flex items-center gap-3 px-4 h-12 bg-surface-900 border-b border-surface-700 shrink-0">
    <!-- Logo -->
    <div class="flex items-center gap-2 mr-2">
      <svg class="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 6h2v12H4V6zm3 0h1v12H7V6zm2 0h2v12H9V6zm3 0h1v12h-1V6zm2 0h2v12h-2V6zm3 0h1v12h-1V6zm2 0h2v12h-2V6z" opacity=".3"/>
        <path d="M2 4h20v2H2V4zm0 14h20v2H2v-2zM5 9l7 3-7 3V9z"/>
      </svg>
      <span class="text-sm font-bold tracking-wide text-white">FluidVC</span>
    </div>

    <!-- File info -->
    <div v-if="videoStore.file" class="flex items-center gap-2 text-xs text-gray-400 border-l border-surface-600 pl-3">
      <span class="text-gray-200 font-medium max-w-[200px] truncate">{{ videoStore.file.name }}</span>
      <span class="text-surface-400">·</span>
      <span>{{ videoStore.file.width }}×{{ videoStore.file.height }}</span>
      <span class="text-surface-400">·</span>
      <span>{{ videoStore.file.fps }}fps</span>
      <span class="text-surface-400">·</span>
      <span>{{ videoStore.file.codec }}</span>
    </div>

    <div class="flex-1" />

    <!-- Segment summary -->
    <div v-if="segmentStore.segments.length > 0" class="flex items-center gap-2 text-xs text-gray-400">
      <span class="text-accent font-semibold">{{ segmentStore.enabledSegments.length }}</span>
      <span>segment{{ segmentStore.enabledSegments.length !== 1 ? 's' : '' }}</span>
      <span class="text-surface-400">·</span>
      <span>{{ formatDuration(segmentStore.totalDuration) }}</span>
    </div>

    <!-- Actions -->
    <BaseButton
      v-if="!videoStore.hasFile"
      variant="ghost"
      size="sm"
      :disabled="videoStore.isLoading"
      :loading="videoStore.isLoading"
      @click="videoStore.loadFile()"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      Open Video
    </BaseButton>
    <BaseButton
      v-else
      variant="ghost"
      size="sm"
      @click="videoStore.unloadFile()"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Unload Video
    </BaseButton>

    <!-- Update notifications -->
    <div v-if="updateDownloaded" class="flex items-center gap-2">
      <button
        class="flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 transition-colors"
        @click="restartAndUpdate"
      >
        <svg class="w-3.5 h-3.5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Restart to update v{{ updateDownloaded.version }}
      </button>
    </div>
    <div v-else-if="updateAvailable" class="flex items-center gap-1.5 text-xs text-gray-500">
      <span class="inline-block w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
      Downloading v{{ updateAvailable.version }}{{ downloadPercent !== null ? ` (${downloadPercent}%)` : '' }}
    </div>

    <BaseButton
      variant="primary"
      size="sm"
      :disabled="!segmentStore.canExport"
      @click="$emit('export')"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export
    </BaseButton>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'
import { useSegmentStore } from '@/stores/segmentStore.js'
import { formatDuration } from '@/utils/timecode.js'
import BaseButton from '@/components/ui/BaseButton.vue'

const videoStore = useVideoStore()
const segmentStore = useSegmentStore()

defineEmits(['export'])

// Auto-update state
const updateAvailable = ref(null)   // { version }
const updateDownloaded = ref(null)  // { version }
const downloadPercent = ref(null)

let unsubAvailable, unsubProgress, unsubDownloaded

onMounted(() => {
  if (!window.api) return
  unsubAvailable = window.api.onUpdateAvailable((data) => {
    updateAvailable.value = data
    downloadPercent.value = 0
  })
  unsubProgress = window.api.onDownloadProgress((data) => {
    downloadPercent.value = data.percent
  })
  unsubDownloaded = window.api.onUpdateDownloaded((data) => {
    updateDownloaded.value = data
    updateAvailable.value = null
  })
})

onUnmounted(() => {
  unsubAvailable?.()
  unsubProgress?.()
  unsubDownloaded?.()
})

function restartAndUpdate() {
  window.api.quitAndInstall()
}
</script>
