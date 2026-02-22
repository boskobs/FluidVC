import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useSegmentStore = defineStore('segment', () => {
  /** @type {import('vue').Ref<Array<{id:string,name:string,startTime:number,endTime:number,enabled:boolean}>>} */
  const segments = ref([])
  const pendingIn = ref(null) // seconds where user pressed "Mark In"
  const selectedId = ref(null)

  const enabledSegments = computed(() =>
    segments.value.filter((s) => s.enabled),
  )
  const totalDuration = computed(() =>
    enabledSegments.value.reduce((acc, s) => acc + (s.endTime - s.startTime), 0),
  )
  const canExport = computed(() =>
    enabledSegments.value.length > 0 &&
    enabledSegments.value.every((s) => s.endTime > s.startTime),
  )

  function markIn(time) {
    pendingIn.value = time
  }

  function markOut(time) {
    if (pendingIn.value === null) {
      pendingIn.value = Math.max(0, time - 5)
    }
    const start = Math.min(pendingIn.value, time)
    const end = Math.max(pendingIn.value, time)
    if (end - start < 0.1) {
      // Too short — ignore
      pendingIn.value = null
      return
    }
    const seg = {
      id: uuidv4(),
      name: '',
      startTime: start,
      endTime: end,
      enabled: true,
    }
    segments.value.push(seg)
    selectedId.value = seg.id
    pendingIn.value = null
  }

  function addSegment(startTime = 0, endTime = 10) {
    const seg = {
      id: uuidv4(),
      name: '',
      startTime,
      endTime,
      enabled: true,
    }
    segments.value.push(seg)
    selectedId.value = seg.id
    return seg
  }

  function updateSegment(id, patch) {
    const idx = segments.value.findIndex((s) => s.id === id)
    if (idx === -1) return
    segments.value[idx] = { ...segments.value[idx], ...patch }
  }

  function removeSegment(id) {
    const idx = segments.value.findIndex((s) => s.id === id)
    if (idx !== -1) {
      segments.value.splice(idx, 1)
    }
    if (selectedId.value === id) {
      selectedId.value = segments.value[0]?.id ?? null
    }
  }

  function clearAll() {
    segments.value = []
    selectedId.value = null
    pendingIn.value = null
  }

  function toggleEnabled(id) {
    const seg = segments.value.find((s) => s.id === id)
    if (seg) seg.enabled = !seg.enabled
  }

  function selectSegment(id) {
    selectedId.value = id
  }

  /**
   * Reorder: move segment from fromIndex to toIndex.
   */
  function reorder(fromIndex, toIndex) {
    if (fromIndex === toIndex) return
    const arr = [...segments.value]
    const [item] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, item)
    segments.value = arr
  }

  function sortByTime() {
    segments.value = [...segments.value].sort((a, b) => a.startTime - b.startTime)
  }

  return {
    segments,
    pendingIn,
    selectedId,
    enabledSegments,
    totalDuration,
    canExport,
    markIn,
    markOut,
    addSegment,
    updateSegment,
    removeSegment,
    clearAll,
    toggleEnabled,
    selectSegment,
    reorder,
    sortByTime,
  }
})
