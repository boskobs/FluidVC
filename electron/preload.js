import { ipcRenderer, contextBridge } from 'electron'

/**
 * Expose a safe, channel-whitelisted API to the renderer via window.api
 */
contextBridge.exposeInMainWorld('api', {
  /** Open a video file dialog; resolves with VideoFile metadata or null */
  openVideoFile() {
    return ipcRenderer.invoke('dialog:openVideo')
  },

  /** Open a save dialog; resolves with output path string or null */
  saveFileDialog(defaultName) {
    return ipcRenderer.invoke('dialog:saveFile', defaultName)
  },

  /** Get metadata for a given file path */
  getVideoMetadata(filePath) {
    return ipcRenderer.invoke('video:getMetadata', filePath)
  },

  /**
   * Start an export operation
   * @param {object} opts - { inputPath, segments, outputPath, mode, codec?, crf? }
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  exportVideo(opts) {
    return ipcRenderer.invoke('video:export', opts)
  },

  /** Cancel the currently running export */
  cancelExport() {
    return ipcRenderer.invoke('video:cancelExport')
  },

  /**
   * Register a callback for export progress updates.
   * Returns an unsubscribe function.
   * @param {function} callback
   * @returns {function} unsubscribe
   */
  onExportProgress(callback) {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('export:progress', handler)
    return () => ipcRenderer.off('export:progress', handler)
  },
})
