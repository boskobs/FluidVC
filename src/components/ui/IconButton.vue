<template>
  <BaseTooltip :text="tooltip" :position="tooltipPosition">
    <button
      v-bind="$attrs"
      :class="[
        'inline-flex items-center justify-center rounded-md transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        sizeClasses,
        variantClasses,
      ]"
    >
      <slot />
    </button>
  </BaseTooltip>
</template>

<script setup>
import { computed } from 'vue'
import BaseTooltip from './BaseTooltip.vue'

// Prevent Vue from automatically forwarding attrs to the root BaseTooltip component.
// Without this, @click and other listeners land on both the wrapper div (via
// BaseTooltip's inheritAttrs) AND the inner button (via v-bind="$attrs"), causing
// every click to fire twice and toggle-style actions to immediately reverse.
defineOptions({ inheritAttrs: false })

const props = defineProps({
  tooltip: { type: String, default: '' },
  tooltipPosition: { type: String, default: 'top' },
  variant: { type: String, default: 'ghost' }, // ghost | primary | danger | active
  size: { type: String, default: 'md' }, // sm | md | lg
})

const variantClasses = computed(() => ({
  ghost: 'text-gray-400 hover:text-white hover:bg-surface-600',
  primary: 'text-white bg-accent hover:bg-accent-light',
  danger: 'text-danger hover:text-white hover:bg-danger/30',
  active: 'text-accent bg-accent/10 hover:bg-accent/20',
}[props.variant] || 'text-gray-400 hover:text-white hover:bg-surface-600'))

const sizeClasses = computed(() => ({
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}[props.size] || 'w-8 h-8'))
</script>
