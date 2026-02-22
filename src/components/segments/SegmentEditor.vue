<template>
  <div class="px-3 py-2 bg-surface-900/50 border-t border-surface-700 space-y-2">
    <!-- Name -->
    <BaseInput
      :model-value="segment.name"
      label="Chapter name (optional)"
      placeholder="e.g. Introduction"
      @update:model-value="update({ name: $event })"
    />

    <!-- Times -->
    <div class="flex items-end gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-400">Start</label>
        <TimecodeInput
          :model-value="segment.startTime"
          @update:model-value="update({ startTime: Math.min($event, segment.endTime - 0.1) })"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-400">End</label>
        <TimecodeInput
          :model-value="segment.endTime"
          @update:model-value="update({ endTime: Math.max($event, segment.startTime + 0.1) })"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-400">Duration</label>
        <span class="timecode text-sm text-gray-300 px-2 py-1">
          {{ secondsToTimecode(segment.endTime - segment.startTime, false) }}
        </span>
      </div>
    </div>

    <!-- Set to current time shortcuts -->
    <div class="flex gap-2">
      <BaseButton variant="ghost" size="sm" @click="update({ startTime: currentTime })">
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M6 3h2v18H6zm10.5 9L11 7v10z"/></svg>
        Set In to current
      </BaseButton>
      <BaseButton variant="ghost" size="sm" @click="update({ endTime: currentTime })">
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M18 3h-2v18h2zm-10.5 9L13 17V7z"/></svg>
        Set Out to current
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'
import { secondsToTimecode } from '@/utils/timecode.js'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TimecodeInput from '@/components/ui/TimecodeInput.vue'

const props = defineProps({
  segment: { type: Object, required: true },
})

const emit = defineEmits(['update'])
const videoStore = useVideoStore()
const currentTime = computed(() => videoStore.currentTime)

function update(patch) {
  emit('update', patch)
}
</script>
