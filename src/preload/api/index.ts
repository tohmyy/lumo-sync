import { ipcRenderer, type IpcRendererEvent } from 'electron'
import { ALLOWED_EVENTS, AppEvents, IpcChannels, type AppEventName } from '../../shared/constants'
import type { LumoSyncApi } from '../types/api'

function isAllowedEvent(event: string): event is AppEventName {
  return (ALLOWED_EVENTS as readonly string[]).includes(event)
}

export function createPreloadApi(): LumoSyncApi {
  return {
    assets: {
      list: (query) => ipcRenderer.invoke(IpcChannels.asset.list, query ?? {}),
      get: (id) => ipcRenderer.invoke(IpcChannels.asset.get, { id }),
      create: (input) => ipcRenderer.invoke(IpcChannels.asset.create, input),
      update: (id, input) => ipcRenderer.invoke(IpcChannels.asset.update, { id, input }),
      delete: (id) => ipcRenderer.invoke(IpcChannels.asset.delete, { id }),
      restore: (id) => ipcRenderer.invoke(IpcChannels.asset.restore, { id })
    },
    collections: {
      list: () => ipcRenderer.invoke(IpcChannels.collection.list),
      get: (id) => ipcRenderer.invoke(IpcChannels.collection.get, { id }),
      create: (input) => ipcRenderer.invoke(IpcChannels.collection.create, input),
      update: (id, input) => ipcRenderer.invoke(IpcChannels.collection.update, { id, input }),
      delete: (id) => ipcRenderer.invoke(IpcChannels.collection.delete, { id }),
      addAsset: (collectionId, assetId) =>
        ipcRenderer.invoke(IpcChannels.collection.addAsset, { collectionId, assetId }),
      removeAsset: (collectionId, assetId) =>
        ipcRenderer.invoke(IpcChannels.collection.removeAsset, { collectionId, assetId }),
      listAssets: (id) => ipcRenderer.invoke(IpcChannels.collection.listAssets, { id })
    },
    tags: {
      list: () => ipcRenderer.invoke(IpcChannels.tag.list),
      create: (input) => ipcRenderer.invoke(IpcChannels.tag.create, input),
      update: (id, input) => ipcRenderer.invoke(IpcChannels.tag.update, { id, input }),
      delete: (id) => ipcRenderer.invoke(IpcChannels.tag.delete, { id })
    },
    search: {
      query: (query, options) =>
        ipcRenderer.invoke(IpcChannels.search.query, {
          query,
          type: options?.type,
          limit: options?.limit
        })
    },
    recent: {
      list: (limit) => ipcRenderer.invoke(IpcChannels.recent.list, { limit }),
      track: (assetId) => ipcRenderer.invoke(IpcChannels.recent.track, { assetId })
    },
    settings: {
      get: (key) => ipcRenderer.invoke(IpcChannels.settings.get, { key }),
      getAll: () => ipcRenderer.invoke(IpcChannels.settings.getAll),
      update: (key, value) => ipcRenderer.invoke(IpcChannels.settings.update, { key, value })
    },
    device: {
      getCurrent: () => ipcRenderer.invoke(IpcChannels.device.getCurrent),
      list: () => ipcRenderer.invoke(IpcChannels.device.list)
    },
    sync: {
      status: () => ipcRenderer.invoke(IpcChannels.sync.status),
      now: () => ipcRenderer.invoke(IpcChannels.sync.now),
      listConflicts: () => ipcRenderer.invoke(IpcChannels.sync.listConflicts),
      resolveConflict: (id, resolution) =>
        ipcRenderer.invoke(IpcChannels.sync.resolveConflict, { id, resolution })
    },
    events: {
      on: (event, handler) => {
        if (!isAllowedEvent(event)) {
          throw new Error(`Event not allowed: ${event}`)
        }
        const listener = (_e: IpcRendererEvent, payload: unknown): void => {
          handler(payload)
        }
        ipcRenderer.on(event, listener)
        return () => {
          ipcRenderer.removeListener(event, listener)
        }
      }
    }
  }
}

export { AppEvents }
