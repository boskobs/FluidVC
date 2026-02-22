import { app, BrowserWindow, ipcMain, protocol, net } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerIpcHandlers } from './ipcHandlers.js'

// Must be called before app.whenReady()
protocol.registerSchemesAsPrivileged([
  { scheme: 'localvideo', privileges: { secure: true, supportFetchAPI: true, stream: true, bypassCSP: true, corsEnabled: true } },
])

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    backgroundColor: '#0d0d12',
    titleBarStyle: process.platform === 'linux' ? 'default' : 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // Required so the renderer (served from http://localhost in dev or
      // file:// in prod) can load file:// media URLs for local video files.
      webSecurity: false,
    },
  })

  win.setMenuBarVisibility(false)

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.whenReady().then(() => {
  // Serve local video files through a privileged scheme so Chromium allows media playback
  protocol.handle('localvideo', (request) => {
    const filePath = decodeURIComponent(request.url.slice('localvideo://'.length))
    return net.fetch(`file://${filePath}`)
  })

  registerIpcHandlers(ipcMain, win, () => win)
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
