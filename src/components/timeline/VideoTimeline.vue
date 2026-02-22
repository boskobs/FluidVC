<template>
  <div class="flex flex-col bg-surface-900 border-t border-surface-700 select-none" style="height: 120px">
    <!-- Ruler -->
    <TimelineRuler :duration="videoStore.duration" :px-per-second="pxPerSecond" />

    <!-- Segment track -->
    <div
      ref="trackRef"
      class="relative flex-1 overflow-x-auto overflow-y-hidden cursor-crosshair"
      @mousedown="onTrackMouseDown"
      @click="onTrackClick"
    >
      <!-- Track content: scaled by duration -->
      <div
        class="relative h-full"
        :style="{ width: trackWidth }"
      >
        <!-- Background grid lines (minor ticks) -->
        <div class="absolute inset-0 pointer-events-none" />

        <!-- Cursor -->
        <TimelineCursor
          :position="videoStore.duration > 0 ? (videoStore.currentTime / videoStore.duration) * 100 : 0"
        />

        <!-- Pending In marker -->
        <div
          v-if="segmentStore.pendingIn !== null && videoStore.duration > 0"
          class="absolute top-0 bottom-0 w-0.5 bg-yellow-400/70 z-10 pointer-events-none"
          :style="{ left: `${(segmentStore.pendingIn / videoStore.duration) * 100}%` }"
        >
          <span class="absolute top-1 left-1 text-[9px] text-yellow-400 font-mono">IN</span>
        </div>

        <!-- Draft segment being drawn -->
        <div
          v-if="draft"
          class="absolute top-1 bottom-1 bg-accent/30 border border-accent/60 rounded pointer-events-none z-10"
          :style="{
            left: `${Math.min(draft.startPct, draft.endPct)}%`,
            width: `${Math.abs(draft.endPct - draft.startPct)}%`,
          }"
        />

        <!-- Existing segments -->
        <TimelineSegment
          v-for="seg in segmentStore.segments"
          :key="seg.id"
          :segment="seg"
          :duration="videoStore.duration"
          :is-selected="segmentStore.selectedId === seg.id"
          :container-width="containerPxWidth"
          @select="segmentStore.selectSegment(seg.id)"
          @update="(patch) => segmentStore.updateSegment(seg.id, patch)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'
import { useSegmentStore } from '@/stores/segmentStore.js'
import TimelineRuler from './TimelineRuler.vue'
import TimelineCursor from './TimelineCursor.vue'
import TimelineSegment from './TimelineSegment.vue'

const videoStore = useVideoStore()
const segmentStore = useSegmentStore()

const trackRef = ref(null)
const containerPxWidth = ref(0)

// px per second — determines zoom level. Start at a reasonable default.
const pxPerSecond = computed(() => {
  if (!videoStore.duration) return 100
  // Fill the visible container width, but at least 2px/s and at most 500px/s
  const visiblePx = containerPxWidth.value || 800
  const fill = visiblePx / videoStore.duration
  return Math.max(2, Math.min(500, fill))
})

const trackWidth = computed(() => {
  if (!videoStore.duration) return '100%'
  return `${Math.max(containerPxWidth.value, videoStore.duration * pxPerSecond.value)}px`
})

// Track container resize
let ro = null
onMounted(() => {
  if (trackRef.value) {
    containerPxWidth.value = trackRef.value.clientWidth
    ro = new ResizeObserver((entries) => {
      containerPxWidth.value = entries[0].contentRect.width
    })
    ro.observe(trackRef.value)
  }
})
onUnmounted(() => ro?.disconnect())

// Click on empty track → seek
function onTrackClick(e) {
  if (!videoStore.duration || e.target !== trackRef.value && !isDraftClick) return
  const rect = trackRef.value.getBoundingClientRect()
  const scrollLeft = trackRef.value.scrollLeft
  const xInTrack = e.clientX - rect.left + scrollLeft
  const totalWidth = parseFloat(trackWidth.value) || containerPxWidth.value
  const t = (xInTrack / totalWidth) * videoStore.duration
  videoStore.setCurrentTime(t)
}

// Drag on track to create a new segment
const draft = ref(null)
let isDraftClick = false

function onTrackMouseDown(e) {
  if (!videoStore.duration) return
  if (e.button !== 0) return
  // Only start draft if clicking on the track background, not on a segment
  if (e.target !== trackRef.value && !e.target.classList.contains('relative')) return

  isDraftClick = false
  const rect = trackRef.value.getBoundingClientRect()
  const scrollLeft = trackRef.value.scrollLeft
  const totalPxWidth = parseFloat(trackWidth.value) || containerPxWidth.value

  function xToPct(clientX) {
    const xInTrack = clientX - rect.left + scrollLeft
    return Math.max(0, Math.min(100, (xInTrack / totalPxWidth) * 100))
  }

  const startPct = xToPct(e.clientX)
  draft.value = { startPct, endPct: startPct }

  function onMove(ev) {
    draft.value = { startPct, endPct: xToPct(ev.clientX) }
  }

  function onUp(ev) {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)

    const endPct = xToPct(ev.clientX)
    const span = Math.abs(endPct - startPct)

    if (span > 0.3 && videoStore.duration > 0) {
      const startTime = (Math.min(startPct, endPct) / 100) * videoStore.duration
      const endTime = (Math.max(startPct, endPct) / 100) * videoStore.duration
      segmentStore.addSegment(startTime, endTime)
      isDraftClick = true
    }
    draft.value = null
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>
