import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './window/create-window'
import { createLogger } from './logging/logger'

const log = createLogger('main')

app.setName('LumoSync')

app
  .whenReady()
  .then(() => {
    log.info('Starting LumoSync application shell')
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
      }
    })
  })
  .catch((error) => {
    log.error({ err: error }, 'Failed to start application shell')
    app.quit()
  })

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
