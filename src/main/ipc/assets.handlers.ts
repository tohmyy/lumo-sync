import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/constants'
import {
  assetIdSchema,
  assetListQuerySchema,
  createAssetSchema,
  updateAssetRequestSchema
} from '../../shared/schemas'
import type { Services } from '../services'
import { handleIpc } from './handler-utils'

export function registerAssetHandlers(services: Services): void {
  ipcMain.handle(
    IpcChannels.asset.list,
    handleIpc(assetListQuerySchema.optional().default({}), (query) => services.assets.list(query))
  )

  ipcMain.handle(
    IpcChannels.asset.get,
    handleIpc(assetIdSchema, ({ id }) => services.assets.get(id))
  )

  ipcMain.handle(
    IpcChannels.asset.create,
    handleIpc(createAssetSchema, (input) => services.assets.create(input))
  )

  ipcMain.handle(
    IpcChannels.asset.update,
    handleIpc(updateAssetRequestSchema, ({ id, input }) => services.assets.update(id, input))
  )

  ipcMain.handle(
    IpcChannels.asset.delete,
    handleIpc(assetIdSchema, ({ id }) => {
      services.assets.delete(id)
      return { id }
    })
  )

  ipcMain.handle(
    IpcChannels.asset.restore,
    handleIpc(assetIdSchema, ({ id }) => services.assets.restore(id))
  )
}
