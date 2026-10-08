import { shell, type BrowserWindow } from 'electron'
import { createLogger } from '../logging/logger'

const log = createLogger('navigation')

function isAllowedNavigation(url: string): boolean {
  if (url.startsWith('file://')) return true
  if (process.env.ELECTRON_RENDERER_URL && url.startsWith(process.env.ELECTRON_RENDERER_URL)) {
    return true
  }
  // Vite HMR / electron-vite dev server
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
    return true
  }
  return false
}

/** Block in-window navigations; open http(s) externally, never inside the shell. */
export function attachNavigationGuards(window: BrowserWindow): void {
  window.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) {
      log.warn({ url }, 'Blocked navigation')
      event.preventDefault()
    }
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url)
    } else {
      log.warn({ url }, 'Blocked window open')
    }
    return { action: 'deny' }
  })
}
