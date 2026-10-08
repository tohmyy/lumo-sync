import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/constants'
import { resolveConflictSchema } from '../../shared/schemas'
import type { Services } from '../services'
import { handleIpc } from './handler-utils'

export function registerSyncHandlers(services: Services): void {
  ipcMain.handle(
    IpcChannels.sync.status,
    handleIpc(null, () => services.sync.getStatus())
  )

  ipcMain.handle(
    IpcChannels.sync.now,
    handleIpc(null, () => services.sync.syncNow())
  )

  ipcMain.handle(
    IpcChannels.sync.listConflicts,
    handleIpc(null, () => services.sync.listConflicts())
  )

  ipcMain.handle(
    IpcChannels.sync.resolveConflict,
    handleIpc(resolveConflictSchema, (input) =>
      services.sync.resolveConflict(input.id, input.resolution)
    )
  )
}
