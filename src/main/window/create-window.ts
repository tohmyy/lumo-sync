import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { createLogger } from '../logging/logger'

const log = createLogger('window')

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    title: 'LumoSync',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
    log.info('Loaded renderer from dev server')
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
    log.info('Loaded renderer from file')
  }

  return window
}
