import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/constants'
import { settingsGetSchema, settingsUpdateSchema } from '../../shared/schemas'
import type { Services } from '../services'
import { handleIpc } from './handler-utils'

export function registerSettingsHandlers(services: Services): void {
  ipcMain.handle(
    IpcChannels.settings.get,
    handleIpc(settingsGetSchema, ({ key }) => services.settings.get(key))
  )

  ipcMain.handle(
    IpcChannels.settings.getAll,
    handleIpc(null, () => services.settings.getAll())
  )

  ipcMain.handle(
    IpcChannels.settings.update,
    handleIpc(settingsUpdateSchema, ({ key, value }) => services.settings.update(key, value))
  )
}
