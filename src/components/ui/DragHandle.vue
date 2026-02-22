<template>
  <div
    class="flex items-center justify-center w-5 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors shrink-0"
    v-bind="$attrs"
  >
    <!-- Vertical grip dots -->
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
      <circle cx="3" cy="3" r="1.5" />
      <circle cx="7" cy="3" r="1.5" />
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="7" cy="8" r="1.5" />
      <circle cx="3" cy="13" r="1.5" />
      <circle cx="7" cy="13" r="1.5" />
    </svg>
  </div>
</template>

<script setup>
// DragHandle: purely visual. Parent uses @mousedown on this element.
// Pass-through attrs so parent can bind @mousedown directly on this component.
defineOptions({ inheritAttrs: true })
</script>
