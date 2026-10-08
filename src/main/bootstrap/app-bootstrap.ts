import { app, BrowserWindow } from 'electron'
import { createContainer, type AppContainer } from './dependency-container'
import { createMainWindow } from '../window/create-window'
import { closeDatabase } from '../database/connection'
import { createLogger } from '../logging/logger'

const log = createLogger('bootstrap')

let container: AppContainer | null = null
let mainWindow: BrowserWindow | null = null

export async function bootstrapApp(): Promise<void> {
  await app.whenReady()

  log.info('Starting LumoSync')
  container = createContainer()

  mainWindow = createMainWindow()
  container.events.setWindow(mainWindow)

  mainWindow.on('closed', () => {
    container?.events.setWindow(null)
    mainWindow = null
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
      container?.events.setWindow(mainWindow)
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    if (container) {
      container.syncScheduler.stop()
      closeDatabase(container.db)
      container = null
      log.info('Database closed')
    }
  })

  log.info('Application ready')
}

export function getContainer(): AppContainer {
  if (!container) {
    throw new Error('Application container is not initialized')
  }
  return container
}
