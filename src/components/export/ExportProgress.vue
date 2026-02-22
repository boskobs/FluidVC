<template>
  <div class="space-y-4">
    <!-- Phase label -->
    <div class="flex items-center gap-3">
      <span
        v-if="progress.phase !== 'done' && progress.phase !== 'error' && progress.phase !== 'cancelled'"
        class="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0"
      />
      <svg v-else-if="progress.phase === 'done'" class="w-5 h-5 text-success shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
      </svg>
      <svg v-else-if="progress.phase === 'error'" class="w-5 h-5 text-danger shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <span
        class="text-sm"
        :class="{
          'text-gray-300': progress.phase !== 'done' && progress.phase !== 'error',
          'text-success': progress.phase === 'done',
          'text-danger': progress.phase === 'error',
        }"
      >
        {{ progress.message || 'Processing…' }}
      </span>
    </div>

    <!-- Progress bar -->
    <ProgressBar
      :value="progress.percent"
      :color="progress.phase === 'error' ? 'danger' : progress.phase === 'done' ? 'success' : 'accent'"
      label=""
      height="8px"
    />

    <!-- Segment counter -->
    <div v-if="progress.totalSegments > 0" class="flex items-center justify-between text-xs text-gray-500">
      <span>Segment {{ Math.min(progress.segmentIndex + 1, progress.totalSegments) }} of {{ progress.totalSegments }}</span>
      <span>{{ progress.percent }}%</span>
    </div>

    <!-- Error details -->
    <div v-if="progress.phase === 'error'" class="bg-danger/10 border border-danger/30 rounded-md p-3">
      <p class="text-xs text-danger font-mono break-all">{{ progress.message }}</p>
    </div>
  </div>
</template>

<script setup>
import ProgressBar from '@/components/ui/ProgressBar.vue'

defineProps({
  progress: {
    type: Object,
    default: () => ({ phase: 'idle', segmentIndex: 0, totalSegments: 0, percent: 0, message: '' }),
  },
})
</script>
