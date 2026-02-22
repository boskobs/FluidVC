<template>
  <div class="flex flex-col h-screen bg-surface-900 text-gray-100 overflow-hidden">
    <!-- Top header bar -->
    <AppHeader @export="showExport = true" />

    <!-- Main content area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left panel: Player + Timeline -->
      <div
        class="flex flex-col overflow-hidden"
        :style="{ width: leftWidth + 'px', minWidth: '400px' }"
      >
        <!-- Video area -->
        <div class="flex-1 overflow-hidden relative">
          <!-- Importer (shown when no file) -->
          <div v-if="!videoStore.hasFile" class="absolute inset-0 p-4">
            <VideoImporter />
          </div>

          <!-- Player -->
          <div v-else class="absolute inset-0 flex flex-col">
            <div class="flex-1 overflow-hidden p-1">
              <VideoPlayer ref="playerRef" />
            </div>
            <VideoControls
              @toggle-play="playerRef?.togglePlay()"
              @seek="(t) => playerRef?.seek(t)"
              @step-frame="(d) => playerRef?.stepFrame(d)"
              @mark-in="segmentStore.markIn(videoStore.currentTime)"
              @mark-out="segmentStore.markOut(videoStore.currentTime)"
            />
          </div>
        </div>

        <!-- Timeline -->
        <VideoTimeline v-if="videoStore.hasFile" />
      </div>

      <!-- Resize divider -->
      <div
        class="resize-handle"
        @mousedown="startResize"
      />

      <!-- Right panel: Segment list -->
      <div class="flex flex-col flex-1 overflow-hidden panel border-l-0 rounded-none border-r-0 border-b-0 border-t-0">
        <SegmentList />
      </div>
    </div>

    <!-- Export modal -->
    <ExportPanel :open="showExport" @close="showExport = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'
import { useSegmentStore } from '@/stores/segmentStore.js'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts.js'

import AppHeader from '@/components/layout/AppHeader.vue'
import VideoImporter from '@/components/video/VideoImporter.vue'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import VideoControls from '@/components/video/VideoControls.vue'
import VideoTimeline from '@/components/timeline/VideoTimeline.vue'
import SegmentList from '@/components/segments/SegmentList.vue'
import ExportPanel from '@/components/export/ExportPanel.vue'

const videoStore = useVideoStore()
const segmentStore = useSegmentStore()

const playerRef = ref(null)
const showExport = ref(false)

// Keyboard shortcuts (wired to player controls)
useKeyboardShortcuts({
  togglePlay: () => playerRef.value?.togglePlay(),
  stepFrame: (dir) => playerRef.value?.stepFrame(dir),
})

// --- Drag-to-resize left/right panels ---
const leftWidth = ref(700)

function startResize(e) {
  const startX = e.clientX
  const startW = leftWidth.value

  function onMove(ev) {
    const delta = ev.clientX - startX
    leftWidth.value = Math.max(360, Math.min(window.innerWidth - 280, startW + delta))
  }
  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// Adapt left panel to initial window width
onMounted(() => {
  leftWidth.value = Math.round(window.innerWidth * 0.62)
})
</script>
