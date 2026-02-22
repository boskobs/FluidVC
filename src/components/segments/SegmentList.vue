<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="panel-header shrink-0">
      <span class="panel-title">Segments</span>
      <div class="flex items-center gap-1">
        <BaseButton variant="ghost" size="sm" :disabled="segmentStore.segments.length === 0" @click="segmentStore.sortByTime()">
          <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          Sort
        </BaseButton>
        <BaseButton variant="ghost" size="sm" :disabled="segmentStore.segments.length === 0" @click="segmentStore.clearAll()">
          Clear all
        </BaseButton>
        <BaseButton variant="primary" size="sm" :disabled="!videoStore.hasFile" @click="addAtCurrent">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </BaseButton>
      </div>
    </div>

    <!-- Keyboard hint -->
    <div v-if="videoStore.hasFile && segmentStore.segments.length === 0" class="px-3 py-2 text-xs text-gray-500 border-b border-surface-700">
      Press <kbd class="px-1.5 py-0.5 rounded bg-surface-600 font-mono text-gray-300">I</kbd> to mark in,
      <kbd class="px-1.5 py-0.5 rounded bg-surface-600 font-mono text-gray-300">O</kbd> to mark out.
      Or drag on the timeline.
    </div>

    <!-- Empty state -->
    <div v-if="segmentStore.segments.length === 0" class="flex-1 flex flex-col items-center justify-center gap-3 text-center p-4">
      <svg class="w-10 h-10 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
      <p class="text-sm text-gray-500">No segments yet</p>
    </div>

    <!-- List -->
    <div
      v-else
      ref="listRef"
      class="flex-1 overflow-y-auto p-2 space-y-1.5"
    >
      <SegmentItem
        v-for="(seg, i) in segmentStore.segments"
        :key="seg.id"
        :segment="seg"
        :index="i"
        :is-selected="segmentStore.selectedId === seg.id"
        :expanded="expandedId === seg.id"
        :style="dragState && dragState.id === seg.id ? { opacity: 0.35, transition: 'opacity 0.1s' } : {}"
        @select="segmentStore.selectSegment(seg.id)"
        @remove="segmentStore.removeSegment(seg.id)"
        @toggle-enabled="segmentStore.toggleEnabled(seg.id)"
        @update="(patch) => segmentStore.updateSegment(seg.id, patch)"
        @seek-to="(t) => videoStore.setCurrentTime(t)"
        @toggle-expand="toggleExpand(seg.id)"
        @drag-start="(e) => onDragStart(e, i)"
      />
    </div>

    <!-- Drop line (fixed position, follows cursor in real-time) -->
    <Teleport to="body">
      <div
        v-if="dragState && dropLineY !== null"
        class="pointer-events-none fixed z-[9998] flex items-center"
        :style="{ top: dropLineY + 'px', left: listBounds.left + 8 + 'px', width: listBounds.width - 16 + 'px' }"
      >
        <div class="flex-1 h-0.5 rounded-full bg-accent shadow-[0_0_6px_1px_theme(colors.accent.DEFAULT,#6366f1)]" />
        <div class="w-2 h-2 rounded-full bg-accent ring-2 ring-accent/40 -ml-1 shrink-0" />
      </div>

      <!-- Drag ghost card -->
      <div
        v-if="dragState && ghostPos"
        class="pointer-events-none fixed z-[9999] w-56 rounded-lg border border-accent/60 bg-surface-700/90 backdrop-blur-sm shadow-2xl px-3 py-2 select-none"
        :style="{ top: ghostPos.y + 'px', left: ghostPos.x + 'px', transform: 'translate(-16px, -50%) rotate(1.5deg)' }"
      >
        <p class="text-sm font-medium text-gray-200 truncate">
          {{ dragState.segment.name || `Segment ${dragState.fromIndex + 1}` }}
        </p>
        <p class="text-xs font-mono text-gray-500 mt-0.5">
          {{ secondsToTimecode(dragState.segment.startTime, false) }}
          <span class="text-gray-600 mx-1">→</span>
          {{ secondsToTimecode(dragState.segment.endTime, false) }}
        </p>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'
import { useSegmentStore } from '@/stores/segmentStore.js'
import { secondsToTimecode } from '@/utils/timecode.js'
import BaseButton from '@/components/ui/BaseButton.vue'
import SegmentItem from './SegmentItem.vue'

const videoStore = useVideoStore()
const segmentStore = useSegmentStore()

const listRef = ref(null)
const expandedId = ref(null)

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function addAtCurrent() {
  const t = videoStore.currentTime
  const dur = videoStore.duration
  const end = Math.min(t + 5, dur)
  segmentStore.addSegment(t, end > t ? end : Math.min(t + 1, dur))
  segmentStore.selectSegment(segmentStore.segments[segmentStore.segments.length - 1]?.id)
}

// --- Drag to reorder ---
const dragState = ref(null)  // { id, fromIndex, segment }
const dropIndex = ref(null)
const dropLineY = ref(null)  // fixed Y pixel for the drop line
const ghostPos = ref(null)   // { x, y } for the ghost card
const listBounds = ref({ left: 0, width: 0 })

function calcDrop(clientY) {
  if (!listRef.value) return { idx: 0, lineY: clientY }
  const items = listRef.value.querySelectorAll('[data-segment]')
  if (!items.length) return { idx: 0, lineY: clientY }

  let idx = items.length
  let lineY = items[items.length - 1].getBoundingClientRect().bottom

  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect()
    if (clientY < rect.top + rect.height / 2) {
      idx = i
      // Place line at the top edge of this item (midpoint of the gap above)
      lineY = i === 0 ? rect.top : (items[i - 1].getBoundingClientRect().bottom + rect.top) / 2
      break
    } else if (i === items.length - 1) {
      // Below all items
      idx = items.length
      lineY = rect.bottom
    }
  }

  return { idx, lineY }
}

function onDragStart(e, fromIndex) {
  e.preventDefault()
  if (listRef.value) {
    const r = listRef.value.getBoundingClientRect()
    listBounds.value = { left: r.left, width: r.width }
  }
  const seg = segmentStore.segments[fromIndex]
  dragState.value = { id: seg.id, fromIndex, segment: { ...seg } }
  ghostPos.value = { x: e.clientX, y: e.clientY }
  const { idx, lineY } = calcDrop(e.clientY)
  dropIndex.value = idx
  dropLineY.value = lineY
  segmentStore.selectSegment(seg.id)

  const onMove = (ev) => {
    ghostPos.value = { x: ev.clientX, y: ev.clientY }
    const result = calcDrop(ev.clientY)
    dropIndex.value = result.idx
    dropLineY.value = result.lineY
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    if (dragState.value && dropIndex.value !== null && dropIndex.value !== dragState.value.fromIndex) {
      const to = dropIndex.value > dragState.value.fromIndex
        ? dropIndex.value - 1
        : dropIndex.value
      segmentStore.reorder(dragState.value.fromIndex, to)
    }
    dragState.value = null
    dropIndex.value = null
    dropLineY.value = null
    ghostPos.value = null
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>
