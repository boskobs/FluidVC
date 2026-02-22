<template>
  <div class="relative inline-flex items-center">
    <input
      ref="inputRef"
      :value="displayValue"
      :readonly="readonly"
      :class="[
        'font-mono text-sm tabular-nums bg-surface-700 border rounded-md',
        'px-2 py-1 text-gray-100 transition-colors focus:outline-none',
        readonly
          ? 'border-transparent cursor-default select-none'
          : 'border-surface-500 focus:border-accent cursor-text',
        sizeClass,
      ]"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.enter.prevent="commit"
      @keydown.escape.prevent="cancel"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { secondsToTimecode, timecodeToSeconds } from '@/utils/timecode.js'

const props = defineProps({
  modelValue: { type: Number, default: 0 }, // seconds
  readonly: Boolean,
  size: { type: String, default: 'md' }, // sm | md
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
const editing = ref(false)
const editBuffer = ref('')

const displayValue = computed(() =>
  editing.value ? editBuffer.value : secondsToTimecode(props.modelValue),
)

const sizeClass = computed(() => ({
  sm: 'w-28',
  md: 'w-32',
}[props.size] || 'w-32'))

function onFocus() {
  if (props.readonly) return
  editing.value = true
  editBuffer.value = secondsToTimecode(props.modelValue)
  // Select all on next tick
  setTimeout(() => inputRef.value?.select(), 0)
}

function onBlur() {
  commit()
}

function commit() {
  if (!editing.value) return
  const seconds = timecodeToSeconds(editBuffer.value)
  if (isFinite(seconds) && seconds >= 0) {
    emit('update:modelValue', seconds)
  }
  editing.value = false
}

function cancel() {
  editing.value = false
  inputRef.value?.blur()
}

watch(
  () => props.modelValue,
  () => {
    if (!editing.value && inputRef.value !== document.activeElement) {
      // Sync view when not editing
    }
  },
)
</script>
