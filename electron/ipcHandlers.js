import { dialog } from 'electron'
import { getVideoMetadata, exportVideo, cancelExport } from './ffmpegService.js'

const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv', 'wmv', 'm4v', 'ts', 'mts']

/**
 * Register all IPC handlers.
 * @param {Electron.IpcMain} ipcMain
 * @param {Electron.BrowserWindow | null} _win - not used directly; use getWin()
 * @param {() => Electron.BrowserWindow | null} getWin - lazy getter for current window
 */
export function registerIpcHandlers(ipcMain, _win, getWin) {
  // Open a video file dialog and return resolved metadata
  ipcMain.handle('dialog:openVideo', async () => {
    const win = getWin()
    const result = await dialog.showOpenDialog(win, {
      title: 'Open Video',
      filters: [
        { name: 'Video Files', extensions: VIDEO_EXTENSIONS },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    return getVideoMetadata(filePath)
  })

  // Open save dialog for output file
  ipcMain.handle('dialog:saveFile', async (_, defaultName) => {
    const win = getWin()
    const result = await dialog.showSaveDialog(win, {
      title: 'Save Exported Video',
      defaultPath: defaultName || 'output.mp4',
      filters: [
        { name: 'MP4 Video', extensions: ['mp4'] },
        { name: 'MKV Video', extensions: ['mkv'] },
        { name: 'WebM Video', extensions: ['webm'] },
      ],
    })
    return result.canceled ? null : result.filePath
  })

  // Get metadata for an already-known file path
  ipcMain.handle('video:getMetadata', async (_, filePath) => {
    return getVideoMetadata(filePath)
  })

  // Start export
  ipcMain.handle('video:export', async (event, opts) => {
    const win = getWin()
    try {
      await exportVideo({
        ...opts,
        onProgress(progress) {
          if (win && !win.isDestroyed()) {
            win.webContents.send('export:progress', progress)
          }
        },
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  // Cancel in-flight export
  ipcMain.handle('video:cancelExport', () => {
    cancelExport()
    return { success: true }
  })
}
