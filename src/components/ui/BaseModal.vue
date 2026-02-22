<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @mousedown.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Panel -->
        <div
          class="relative z-10 bg-surface-800 border border-surface-600 rounded-xl shadow-2xl w-full flex flex-col"
          :style="{ maxWidth: maxWidth, maxHeight: '90vh' }"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-surface-600 shrink-0">
            <h2 class="text-base font-semibold text-white">{{ title }}</h2>
            <button
              class="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-surface-600"
              aria-label="Close"
              @click="$emit('close')"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-5 py-4 border-t border-surface-600 shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  open: Boolean,
  title: { type: String, default: '' },
  maxWidth: { type: String, default: '560px' },
})

defineEmits(['close'])
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.15s ease;
}
.modal-enter-from .relative {
  transform: scale(0.97) translateY(-8px);
}
.modal-leave-to .relative {
  transform: scale(0.97) translateY(8px);
}
</style>
