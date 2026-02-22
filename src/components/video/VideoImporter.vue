<template>
  <div
    class="flex flex-col items-center justify-center w-full h-full gap-4 rounded-lg border-2 border-dashed transition-colors cursor-pointer"
    :class="isDragging ? 'border-accent bg-accent/5' : 'border-surface-500 hover:border-surface-400 bg-surface-800/30'"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleDrop"
    @click="videoStore.loadFile()"
  >
    <div class="flex flex-col items-center gap-3 pointer-events-none select-none">
      <div class="w-16 h-16 rounded-full bg-surface-700 flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      </div>
      <div class="text-center">
        <p class="text-base font-medium text-gray-300">Drop a video here</p>
        <p class="text-sm text-gray-500 mt-1">or click to browse</p>
        <p class="text-xs text-gray-600 mt-2">MP4, MKV, MOV, AVI, WebM and more</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'

const videoStore = useVideoStore()
const isDragging = ref(false)

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  // In Electron, File objects have a .path property
  const filePath = file.path || file.name
  if (filePath && filePath !== file.name) {
    videoStore.loadFilePath(filePath)
  } else {
    videoStore.loadFile()
  }
}
</script>
