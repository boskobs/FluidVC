<template>
  <div class="relative h-6 select-none pointer-events-none border-b border-surface-600">
    <template v-for="tick in ticks" :key="tick.pos">
      <div
        class="absolute top-0 bottom-0 flex flex-col items-start"
        :style="{ left: `${tick.pos}%` }"
      >
        <div class="w-px bg-surface-500" :class="tick.major ? 'h-full' : 'h-2 mt-auto'" />
        <span v-if="tick.major" class="absolute top-0.5 left-1 text-[10px] font-mono text-gray-500 whitespace-nowrap">
          {{ tick.label }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { secondsToTimecode } from '@/utils/timecode.js'

const props = defineProps({
  duration: { type: Number, default: 0 },
  pxPerSecond: { type: Number, default: 100 },
})

const ticks = computed(() => {
  if (props.duration <= 0) return []

  // Choose a tick interval that gives ~60-120px between major ticks
  const targetPx = 80
  const rawInterval = targetPx / props.pxPerSecond
  // Round interval to a nice number
  const niceIntervals = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600]
  const interval = niceIntervals.find((n) => n >= rawInterval) || niceIntervals[niceIntervals.length - 1]
  const minorInterval = interval / 4

  const result = []
  let t = 0
  while (t <= props.duration + minorInterval * 0.5) {
    const pos = (t / props.duration) * 100
    const isMajor = Math.round(t / interval) * interval === Math.round(t * 1000) / 1000 ||
      Math.abs(t % interval) < 0.001
    result.push({
      pos: Math.min(pos, 100),
      major: isMajor,
      label: secondsToTimecode(t, false),
    })
    t = Math.round((t + minorInterval) * 10000) / 10000
  }
  return result
})
</script>
