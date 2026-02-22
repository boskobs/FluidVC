<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="id" class="text-xs font-medium text-gray-400">{{ label }}</label>
    <input
      :id="id"
      v-bind="$attrs"
      :value="modelValue"
      :class="[
        'w-full bg-surface-700 border rounded-md px-3 py-1.5 text-sm text-gray-100',
        'placeholder:text-gray-500 transition-colors focus:outline-none',
        error
          ? 'border-danger/60 focus:border-danger'
          : 'border-surface-500 focus:border-accent',
      ]"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  error: { type: String, default: '' },
  id: {
    type: String,
    default: () => `input-${Math.random().toString(36).slice(2)}`,
  },
})

defineEmits(['update:modelValue'])
</script>
