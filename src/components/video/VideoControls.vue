<template>
  <div class="flex flex-col gap-2 px-3 py-2 bg-surface-800 border-t border-surface-700">
    <!-- Seek bar -->
    <div class="relative group flex items-center gap-2">
      <span class="timecode text-gray-400 text-xs shrink-0 w-20">{{ secondsToTimecode(videoStore.currentTime, false) }}</span>
      <div class="relative flex-1 h-4 flex items-center cursor-pointer" @click="onSeekClick" @mousedown="startSeeking">
        <!-- Track background -->
        <div class="w-full h-1.5 bg-surface-600 rounded-full overflow-visible relative">
          <!-- Buffered / loaded -->
          <div class="absolute left-0 top-0 h-full bg-surface-500 rounded-full" :style="{ width: '100%' }" />
          <!-- Played fill -->
          <div class="absolute left-0 top-0 h-full bg-accent rounded-full" :style="{ width: `${videoStore.progress}%` }" />
          <!-- Segment markers -->
          <template v-for="seg in segmentStore.segments" :key="seg.id">
            <div
              v-if="videoStore.duration > 0"
              class="absolute top-0 h-full opacity-60"
              :class="seg.enabled ? 'bg-success' : 'bg-gray-500'"
              :style="{
                left: `${(seg.startTime / videoStore.duration) * 100}%`,
                width: `${((seg.endTime - seg.startTime) / videoStore.duration) * 100}%`,
              }"
            />
          </template>
          <!-- Thumb -->
          <div
            class="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow -ml-1.75 opacity-0 group-hover:opacity-100 transition-opacity"
            :style="{ left: `${videoStore.progress}%` }"
          />
        </div>
      </div>
      <span class="timecode text-gray-400 text-xs shrink-0 w-20 text-right">{{ secondsToTimecode(videoStore.duration, false) }}</span>
    </div>

    <!-- Controls row -->
    <div class="flex items-center gap-1">
      <!-- Step back -->
      <IconButton tooltip="Previous frame (←)" size="sm" @click="$emit('stepFrame', -1)">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
      </IconButton>

      <!-- Play/Pause -->
      <IconButton
        :tooltip="videoStore.isPlaying ? 'Pause (Space)' : 'Play (Space)'"
        :variant="videoStore.isPlaying ? 'active' : 'ghost'"
        size="md"
        @click="$emit('togglePlay')"
      >
        <svg v-if="!videoStore.isPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </IconButton>

      <!-- Step forward -->
      <IconButton tooltip="Next frame (→)" size="sm" @click="$emit('stepFrame', 1)">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>
      </IconButton>

      <div class="flex-1" />

      <!-- Current time display -->
      <TimecodeInput
        :model-value="videoStore.currentTime"
        size="sm"
        class="mr-1"
        @update:model-value="$emit('seek', $event)"
      />

      <!-- Volume -->
      <div class="flex items-center gap-1.5 ml-2">
        <IconButton
          :tooltip="videoStore.isMuted ? 'Unmute' : 'Mute'"
          size="sm"
          @click="videoStore.toggleMute()"
        >
          <svg v-if="!videoStore.isMuted && videoStore.volume > 0" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        </IconButton>
        <input
          type="range"
          min="0" max="1" step="0.05"
          :value="videoStore.isMuted ? 0 : videoStore.volume"
          class="w-16 h-1 accent-accent cursor-pointer"
          @input="videoStore.setVolume(parseFloat($event.target.value))"
        />
      </div>

      <div class="w-px h-4 bg-surface-600 mx-2" />

      <!-- Mark In / Mark Out -->
      <BaseButton
        variant="outline"
        size="sm"
        :class="segmentStore.pendingIn !== null ? 'border-accent text-accent' : ''"
        @click="$emit('markIn')"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 3h2v18H6zm10.5 9L11 7v10z"/></svg>
        I
      </BaseButton>

      <BaseButton variant="outline" size="sm" @click="$emit('markOut')">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18 3h-2v18h2zm-10.5 9L13 17V7z"/></svg>
        O
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'
import { useSegmentStore } from '@/stores/segmentStore.js'
import { secondsToTimecode } from '@/utils/timecode.js'
import IconButton from '@/components/ui/IconButton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TimecodeInput from '@/components/ui/TimecodeInput.vue'

const videoStore = useVideoStore()
const segmentStore = useSegmentStore()

const emit = defineEmits(['togglePlay', 'seek', 'stepFrame', 'markIn', 'markOut'])

let isSeeking = false

function posToTime(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  return ratio * videoStore.duration
}

function onSeekClick(e) {
  emit('seek', posToTime(e))
}

function startSeeking(e) {
  isSeeking = true
  // Capture the bounding rect at mousedown so mousemove doesn't need a querySelector
  const rect = e.currentTarget.getBoundingClientRect()
  const toTime = (clientX) => {
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return ratio * videoStore.duration
  }
  emit('seek', toTime(e.clientX))
  const onMove = (ev) => { if (isSeeking) emit('seek', toTime(ev.clientX)) }
  const onUp = () => {
    isSeeking = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>
