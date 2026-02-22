/**
 * Convert seconds (float) to a timecode string: HH:MM:SS.ms
 * @param {number} seconds
 * @param {boolean} [showMs=true]
 * @returns {string}
 */
export function secondsToTimecode(seconds, showMs = true) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000)

  const hStr = String(h).padStart(2, '0')
  const mStr = String(m).padStart(2, '0')
  const sStr = String(s).padStart(2, '0')
  const msStr = String(ms).padStart(3, '0')

  return showMs ? `${hStr}:${mStr}:${sStr}.${msStr}` : `${hStr}:${mStr}:${sStr}`
}

/**
 * Convert a timecode string to seconds.
 * Accepts formats: HH:MM:SS.ms, HH:MM:SS, MM:SS, SS
 * @param {string} str
 * @returns {number}
 */
export function timecodeToSeconds(str) {
  if (!str) return 0
  str = str.trim()
  const parts = str.split(':')
  try {
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2])
    }
    if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
    }
    return parseFloat(parts[0])
  } catch {
    return 0
  }
}

/**
 * Format duration compactly: "1h 23m 45s" or "23m 45s" or "45s"
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/**
 * Clamp a value between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}
