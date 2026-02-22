<template>
  <div class="w-full">
    <div v-if="label" class="flex items-center justify-between mb-1.5">
      <span class="text-xs text-gray-400">{{ label }}</span>
      <span class="text-xs font-mono text-gray-300">{{ Math.round(value) }}%</span>
    </div>
    <div class="w-full bg-surface-600 rounded-full overflow-hidden" :style="{ height: height }">
      <div
        class="h-full rounded-full transition-all duration-300 ease-out"
        :class="colorClasses"
        :style="{ width: `${clampedValue}%` }"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 }, // 0-100
  label: { type: String, default: '' },
  color: { type: String, default: 'accent' }, // accent | success | danger | warning
  height: { type: String, default: '6px' },
})

const clampedValue = computed(() => Math.min(100, Math.max(0, props.value)))

const colorClasses = computed(() => ({
  accent: 'bg-accent',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
}[props.color] || 'bg-accent'))
</script>
