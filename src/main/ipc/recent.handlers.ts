import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/constants'
import { recentListSchema, trackRecentSchema } from '../../shared/schemas'
import type { Services } from '../services'
import { handleIpc } from './handler-utils'

export function registerRecentHandlers(services: Services): void {
  ipcMain.handle(
    IpcChannels.recent.list,
    handleIpc(recentListSchema, (input) => services.recent.list(input?.limit))
  )

  ipcMain.handle(
    IpcChannels.recent.track,
    handleIpc(trackRecentSchema, ({ assetId }) => services.recent.track(assetId))
  )
}
