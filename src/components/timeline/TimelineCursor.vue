<template>
  <!-- Cursor line -->
  <div
    class="absolute top-0 bottom-0 w-0.5 bg-white/80 pointer-events-none z-20 -translate-x-px"
    :style="{ left: `${position}%` }"
  >
    <!-- Head triangle -->
    <div class="absolute -top-px left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white/80" />
  </div>
</template>

<script setup>
defineProps({
  position: { type: Number, default: 0 }, // 0-100 (percentage)
})
</script>
