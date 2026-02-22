<template>
  <div
    class="absolute top-1 bottom-1 rounded flex items-center justify-between group cursor-pointer select-none overflow-hidden"
    :class="[
      segment.enabled
        ? isSelected
          ? 'bg-accent/50 border border-accent'
          : 'bg-accent/25 border border-accent/50 hover:border-accent/80'
        : 'bg-gray-500/20 border border-gray-600/40',
    ]"
    :style="{ left: `${leftPct}%`, width: `${widthPct}%` }"
    @mousedown.stop="onBodyMouseDown"
  >
    <!-- Left resize handle -->
    <div
      class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-white/20"
      @mousedown.stop="onHandleMouseDown($event, 'left')"
    />

    <!-- Label -->
    <span
      v-if="segment.name"
      class="flex-1 px-2 text-[11px] font-medium text-white truncate pointer-events-none"
    >
      {{ segment.name }}
    </span>
    <span
      v-else
      class="flex-1 px-2 text-[11px] text-gray-400 truncate pointer-events-none"
    >
      {{ timecodeShort(segment.startTime) }} – {{ timecodeShort(segment.endTime) }}
    </span>

    <!-- Right resize handle -->
    <div
      class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-white/20"
      @mousedown.stop="onHandleMouseDown($event, 'right')"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { secondsToTimecode } from '@/utils/timecode.js'
import { clamp } from '@/utils/timecode.js'

const props = defineProps({
  segment: { type: Object, required: true },
  duration: { type: Number, required: true },
  isSelected: Boolean,
  containerWidth: { type: Number, default: 0 }, // px width of timeline container
})

const emit = defineEmits(['select', 'update'])

const leftPct = computed(() =>
  props.duration > 0 ? (props.segment.startTime / props.duration) * 100 : 0,
)
const widthPct = computed(() =>
  props.duration > 0 ? ((props.segment.endTime - props.segment.startTime) / props.duration) * 100 : 0,
)

function timecodeShort(t) {
  return secondsToTimecode(t, false)
}

function onBodyMouseDown(e) {
  emit('select')
  // Drag to move the whole segment
  const startX = e.clientX
  const origStart = props.segment.startTime
  const origEnd = props.segment.endTime
  const dur = origEnd - origStart

  function onMove(ev) {
    if (props.containerWidth <= 0 || props.duration <= 0) return
    const dx = ev.clientX - startX
    const dtSec = (dx / props.containerWidth) * props.duration
    const newStart = clamp(origStart + dtSec, 0, props.duration - dur)
    emit('update', { startTime: newStart, endTime: newStart + dur })
  }
  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function onHandleMouseDown(e, side) {
  e.stopPropagation()
  emit('select')
  const startX = e.clientX
  const origStart = props.segment.startTime
  const origEnd = props.segment.endTime

  function onMove(ev) {
    if (props.containerWidth <= 0 || props.duration <= 0) return
    const dx = ev.clientX - startX
    const dtSec = (dx / props.containerWidth) * props.duration
    if (side === 'left') {
      const newStart = clamp(origStart + dtSec, 0, origEnd - 0.1)
      emit('update', { startTime: newStart })
    } else {
      const newEnd = clamp(origEnd + dtSec, origStart + 0.1, props.duration)
      emit('update', { endTime: newEnd })
    }
  }
  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>
