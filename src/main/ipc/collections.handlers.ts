import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/constants'
import {
  collectionAssetSchema,
  collectionIdSchema,
  createCollectionSchema,
  updateCollectionRequestSchema
} from '../../shared/schemas'
import type { Services } from '../services'
import { handleIpc } from './handler-utils'

export function registerCollectionHandlers(services: Services): void {
  ipcMain.handle(
    IpcChannels.collection.list,
    handleIpc(null, () => services.collections.list())
  )

  ipcMain.handle(
    IpcChannels.collection.get,
    handleIpc(collectionIdSchema, ({ id }) => services.collections.get(id))
  )

  ipcMain.handle(
    IpcChannels.collection.create,
    handleIpc(createCollectionSchema, (input) => services.collections.create(input))
  )

  ipcMain.handle(
    IpcChannels.collection.update,
    handleIpc(updateCollectionRequestSchema, ({ id, input }) =>
      services.collections.update(id, input)
    )
  )

  ipcMain.handle(
    IpcChannels.collection.delete,
    handleIpc(collectionIdSchema, ({ id }) => {
      services.collections.delete(id)
      return { id }
    })
  )

  ipcMain.handle(
    IpcChannels.collection.addAsset,
    handleIpc(collectionAssetSchema, ({ collectionId, assetId }) => {
      services.collections.addAsset(collectionId, assetId)
      return { collectionId, assetId }
    })
  )

  ipcMain.handle(
    IpcChannels.collection.removeAsset,
    handleIpc(collectionAssetSchema, ({ collectionId, assetId }) => {
      services.collections.removeAsset(collectionId, assetId)
      return { collectionId, assetId }
    })
  )

  ipcMain.handle(
    IpcChannels.collection.listAssets,
    handleIpc(collectionIdSchema, ({ id }) => services.collections.listAssets(id))
  )
}
