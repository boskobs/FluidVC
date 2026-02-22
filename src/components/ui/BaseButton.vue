<template>
  <button
    v-bind="$attrs"
    :class="classes"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    // primary | ghost | danger | success | outline
  },
  size: {
    type: String,
    default: 'md',
    // sm | md | lg
  },
  loading: Boolean,
  disabled: Boolean,
})

const variantClasses = {
  primary: 'bg-accent hover:bg-accent-light active:bg-accent-dark text-white',
  ghost: 'bg-transparent hover:bg-surface-600 text-gray-300 hover:text-white',
  danger: 'bg-danger/20 hover:bg-danger/30 text-danger border border-danger/40',
  success: 'bg-success/20 hover:bg-success/30 text-success border border-success/40',
  outline: 'bg-transparent border border-surface-500 hover:border-accent text-gray-300 hover:text-white',
}

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

const classes = computed(() => [
  variantClasses[props.variant] || variantClasses.primary,
  sizeClasses[props.size] || sizeClasses.md,
])
</script>
