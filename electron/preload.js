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
   * Create a 240p H.264 proxy for a video the browser cannot play natively.
   * @param {string} filePath - path to the original video
   * @returns {Promise<{success: boolean, proxyPath?: string, error?: string}>}
   */
  createProxyVideo(filePath) {
    return ipcRenderer.invoke('video:createProxy', filePath)
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

  /** Check for updates manually */
  checkForUpdates() {
    return ipcRenderer.invoke('updater:checkForUpdates')
  },

  /** Quit and install the downloaded update */
  quitAndInstall() {
    ipcRenderer.send('updater:quitAndInstall')
  },

  /** Called when an update is available (download starting) */
  onUpdateAvailable(callback) {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('updater:updateAvailable', handler)
    return () => ipcRenderer.off('updater:updateAvailable', handler)
  },

  /** Called with download progress { percent } */
  onDownloadProgress(callback) {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('updater:downloadProgress', handler)
    return () => ipcRenderer.off('updater:downloadProgress', handler)
  },

  /** Called when update is downloaded and ready to install */
  onUpdateDownloaded(callback) {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('updater:updateDownloaded', handler)
    return () => ipcRenderer.off('updater:updateDownloaded', handler)
  },
})
