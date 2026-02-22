<template>
  <div
    ref="anchorRef"
    class="inline-flex"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <slot />

    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="show && text"
          :style="tooltipStyle"
          class="fixed z-[9999] pointer-events-none whitespace-nowrap bg-surface-600 border border-surface-500 text-gray-200 text-xs font-medium px-2 py-1 rounded-md shadow-lg"
        >
          {{ text }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  position: { type: String, default: 'top' },
})

const anchorRef = ref(null)
const show = ref(false)
const coords = reactive({ top: 0, left: 0 })
const GAP = 6

function calcPosition() {
  if (!anchorRef.value) return
  const rect = anchorRef.value.getBoundingClientRect()
  switch (props.position) {
    case 'bottom':
      coords.top = rect.bottom + GAP
      coords.left = rect.left + rect.width / 2
      break
    case 'left':
      coords.top = rect.top + rect.height / 2
      coords.left = rect.left - GAP
      break
    case 'right':
      coords.top = rect.top + rect.height / 2
      coords.left = rect.right + GAP
      break
    default: // top
      coords.top = rect.top - GAP
      coords.left = rect.left + rect.width / 2
      break
  }
}

const transformOrigins = {
  top: 'bottom center',
  bottom: 'top center',
  left: 'center right',
  right: 'center left',
}

const tooltipStyle = ref({})

async function onEnter() {
  calcPosition()
  await nextTick()
  // Build style based on position
  const base = {
    transformOrigin: transformOrigins[props.position] || 'bottom center',
    transform: 'translateX(-50%)',
  }
  switch (props.position) {
    case 'top':
      tooltipStyle.value = { ...base, top: `${coords.top}px`, left: `${coords.left}px`, transform: 'translate(-50%, -100%)' }
      break
    case 'bottom':
      tooltipStyle.value = { ...base, top: `${coords.top}px`, left: `${coords.left}px`, transform: 'translateX(-50%)' }
      break
    case 'left':
      tooltipStyle.value = { top: `${coords.top}px`, left: `${coords.left}px`, transform: 'translate(-100%, -50%)', transformOrigin: 'center right' }
      break
    case 'right':
      tooltipStyle.value = { top: `${coords.top}px`, left: `${coords.left}px`, transform: 'translateY(-50%)', transformOrigin: 'center left' }
      break
    default:
      tooltipStyle.value = { ...base, top: `${coords.top}px`, left: `${coords.left}px`, transform: 'translate(-50%, -100%)' }
  }
  show.value = true
}

function onLeave() {
  show.value = false
}
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
