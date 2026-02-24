<template>
  <BaseModal :open="open" title="Export Video" max-width="600px" @close="tryClose">
    <!-- Exporting view -->
    <div v-if="exportState.isExporting.value || showResult">
      <ExportProgress :progress="exportState.progress.value" />
    </div>

    <!-- Config view -->
    <div v-else class="space-y-5">
      <!-- Segment summary -->
      <div class="bg-surface-700 rounded-lg p-3 space-y-2">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Segments to export</p>
        <div
          v-for="(seg, i) in segmentStore.enabledSegments"
          :key="seg.id"
          class="flex items-center gap-2 text-sm"
        >
          <span class="text-gray-500 font-mono w-4 text-right">{{ i + 1 }}.</span>
          <span class="text-gray-200 flex-1 truncate">{{ seg.name || `Segment ${i + 1}` }}</span>
          <span class="text-gray-500 font-mono text-xs">
            {{ secondsToTimecode(seg.startTime, false) }} – {{ secondsToTimecode(seg.endTime, false) }}
          </span>
          <span class="text-gray-600 font-mono text-xs">({{ secondsToTimecode(seg.endTime - seg.startTime, false) }})</span>
        </div>
        <div class="border-t border-surface-600 pt-2 mt-2 flex justify-between text-xs text-gray-400">
          <span>{{ segmentStore.enabledSegments.length }} segment{{ segmentStore.enabledSegments.length !== 1 ? 's' : '' }}</span>
          <span>Total: {{ secondsToTimecode(segmentStore.totalDuration, false) }}</span>
        </div>
      </div>

      <!-- Output path -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-400">Output file</label>
        <div class="flex gap-2">
          <input
            :value="outputPath"
            readonly
            placeholder="Choose output location…"
            class="flex-1 bg-surface-700 border border-surface-500 rounded-md px-3 py-1.5 text-sm text-gray-300 cursor-default"
            @click="browseOutput"
          />
          <BaseButton variant="outline" size="sm" @click="browseOutput">Browse</BaseButton>
        </div>
        <p v-if="errors.outputPath" class="text-xs text-danger">{{ errors.outputPath }}</p>
      </div>

      <!-- Mode -->
      <BaseSelect
        v-model="mode"
        label="Export mode"
        :options="modeOptions"
      />

      <!-- Re-encode options -->
      <Transition name="fade">
        <div v-if="mode === 'reencode'" class="space-y-4 bg-surface-700/50 rounded-lg p-3">
          <BaseSelect
            v-model="codec"
            label="Video codec"
            :options="codecOptions"
          />
          <div class="space-y-1">
            <label class="text-xs font-medium text-gray-400">
              Quality (CRF: {{ crf }})
              <span class="text-gray-600 ml-1">— lower = better quality, larger file</span>
            </label>
            <div class="flex items-center gap-3">
              <span class="text-xs text-gray-500">Best</span>
              <input
                v-model.number="crf"
                type="range"
                min="0"
                max="51"
                step="1"
                class="flex-1 accent-accent"
              />
              <span class="text-xs text-gray-500">Worst</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Mode descriptions -->
      <div v-if="mode === 'copy'" class="text-xs text-gray-500 bg-surface-700/30 rounded-md p-2.5">
        <strong class="text-gray-400">Stream copy</strong> is very fast and lossless. Cut points may be slightly
        inaccurate (aligned to keyframes). Use Re-encode for frame-perfect cuts.
      </div>
    </div>

    <template #footer>
      <!-- Exporting: show cancel / close -->
      <div v-if="exportState.isExporting.value || showResult" class="flex justify-between items-center">
        <div>
          <span v-if="exportState.exportDone.value" class="text-sm text-success">Export complete!</span>
          <span v-else-if="exportState.exportError.value" class="text-sm text-danger">Export failed.</span>
        </div>
        <div class="flex gap-2">
          <BaseButton v-if="exportState.isExporting.value" variant="danger" @click="exportState.cancel()">
            Cancel
          </BaseButton>
          <BaseButton v-if="showResult" variant="ghost" @click="resetAndClose">
            Close
          </BaseButton>
          <BaseButton v-if="exportState.exportDone.value || exportState.exportError.value" variant="outline" @click="retry">
            Export again
          </BaseButton>
        </div>
      </div>

      <!-- Ready: show export button -->
      <div v-else class="flex justify-end gap-2">
        <BaseButton variant="ghost" @click="tryClose">Cancel</BaseButton>
        <BaseButton
          variant="primary"
          :disabled="!canStart"
          @click="startExport"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export {{ segmentStore.enabledSegments.length }} segment{{ segmentStore.enabledSegments.length !== 1 ? 's' : '' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSegmentStore } from '@/stores/segmentStore.js'
import { useVideoStore } from '@/stores/videoStore.js'
import { useExport } from '@/composables/useExport.js'
import { secondsToTimecode } from '@/utils/timecode.js'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import ExportProgress from './ExportProgress.vue'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])

const segmentStore = useSegmentStore()
const videoStore = useVideoStore()
const exportState = useExport()

// Form state
const outputPath = ref('')
const mode = ref('copy')
const codec = ref('libx264')
const crf = ref(23)
const errors = ref({})

const showResult = computed(
  () => exportState.exportDone.value || !!exportState.exportError.value,
)

const modeOptions = [
  { label: 'Stream copy (fast, lossless)', value: 'copy' },
  { label: 'Re-encode (frame-accurate)', value: 'reencode' },
]

const codecOptions = [
  { label: 'H.264 (libx264) — best compatibility', value: 'libx264' },
  { label: 'H.265 (libx265) — smaller files', value: 'libx265' },
  { label: 'VP9 (libvpx-vp9) — open source', value: 'libvpx-vp9' },
]

const canStart = computed(
  () => outputPath.value.trim() && segmentStore.canExport,
)

async function browseOutput() {
  const baseName = (videoStore.file?.name || 'output').replace(/\.[^.]+$/, '')
  const result = await window.api.saveFileDialog(`${baseName}_export.mp4`)
  if (result) outputPath.value = result
}

function validate() {
  const e = {}
  if (!outputPath.value.trim()) e.outputPath = 'Please choose an output file location.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function startExport() {
  if (!validate()) return
  exportState.reset()
  await exportState.start({
    outputPath: outputPath.value,
    mode: mode.value,
    codec: codec.value,
    crf: crf.value,
  })
}

function resetAndClose() {
  exportState.reset()
  emit('close')
}

function retry() {
  exportState.reset()
}

function tryClose() {
  if (exportState.isExporting.value) return
  resetAndClose()
}

// Clear errors when output path is set
watch(outputPath, () => { errors.value = {} })

// Reset when modal opens
watch(() => props.open, (v) => {
  if (v) {
    outputPath.value = ''
    errors.value = {}
    exportState.reset()
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, max-height 0.2s ease;
  max-height: 300px;
  overflow: hidden;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
