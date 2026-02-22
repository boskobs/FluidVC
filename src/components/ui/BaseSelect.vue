<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="id" class="text-xs font-medium text-gray-400">{{ label }}</label>
    <select
      :id="id"
      :value="modelValue"
      class="w-full bg-surface-700 border border-surface-500 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-accent transition-colors cursor-pointer"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
        :disabled="opt.disabled"
        class="bg-surface-800"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  options: {
    type: Array,
    default: () => [],
    // [{ label: string, value: string, disabled?: boolean }]
  },
  id: {
    type: String,
    default: () => `select-${Math.random().toString(36).slice(2)}`,
  },
})

defineEmits(['update:modelValue'])
</script>
