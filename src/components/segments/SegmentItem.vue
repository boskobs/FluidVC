<template>
  <div
    data-segment
    class="border rounded-lg overflow-hidden transition-colors"
    :class="[
      isSelected
        ? 'border-accent/60 bg-surface-700'
        : 'border-surface-600 bg-surface-800 hover:border-surface-500',
      !segment.enabled ? 'opacity-50' : '',
    ]"
  >
    <!-- Main row -->
    <div
      class="flex items-center gap-2 px-2 py-2 cursor-pointer"
      @click="$emit('select')"
    >
      <!-- Drag handle -->
      <DragHandle @mousedown.stop="$emit('dragStart', $event)" />

      <!-- Enabled toggle -->
      <input
        type="checkbox"
        :checked="segment.enabled"
        class="w-3.5 h-3.5 rounded accent-accent cursor-pointer shrink-0"
        @change="$emit('toggleEnabled')"
        @click.stop
      />

      <!-- Color indicator -->
      <div
        class="w-1 self-stretch rounded-full shrink-0"
        :class="segment.enabled ? 'bg-accent' : 'bg-gray-600'"
      />

      <!-- Index -->
      <span class="text-xs font-mono text-gray-500 w-5 text-center shrink-0">{{ index + 1 }}</span>

      <!-- Name / timecodes -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-200 truncate">
          {{ segment.name || `Segment ${index + 1}` }}
        </p>
        <p class="text-xs font-mono text-gray-500">
          {{ secondsToTimecode(segment.startTime, false) }}
          <span class="text-gray-600 mx-1">→</span>
          {{ secondsToTimecode(segment.endTime, false) }}
          <span class="text-gray-600 ml-2">({{ secondsToTimecode(segment.endTime - segment.startTime, false) }})</span>
        </p>
      </div>

      <!-- Seek to start -->
      <IconButton tooltip="Seek to start" size="sm" @click.stop="$emit('seekTo', segment.startTime)">
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
      </IconButton>

      <!-- Expand/editor toggle -->
      <IconButton
        :tooltip="expanded ? 'Collapse' : 'Edit'"
        :variant="expanded ? 'active' : 'ghost'"
        size="sm"
        @click.stop="$emit('toggleExpand')"
      >
        <svg class="w-3.5 h-3.5 transition-transform" :class="expanded ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </IconButton>

      <!-- Delete -->
      <IconButton tooltip="Delete segment (Del)" variant="danger" size="sm" @click.stop="$emit('remove')">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </IconButton>
    </div>

    <!-- Expanded editor -->
    <SegmentEditor
      v-if="expanded"
      :segment="segment"
      @update="$emit('update', $event)"
    />
  </div>
</template>

<script setup>
import { secondsToTimecode } from '@/utils/timecode.js'
import DragHandle from '@/components/ui/DragHandle.vue'
import IconButton from '@/components/ui/IconButton.vue'
import SegmentEditor from './SegmentEditor.vue'

defineProps({
  segment: { type: Object, required: true },
  index: { type: Number, required: true },
  isSelected: Boolean,
  expanded: Boolean,
})

defineEmits(['select', 'remove', 'toggleEnabled', 'update', 'seekTo', 'toggleExpand', 'dragStart'])
</script>
