import type {
  Asset,
  AssetListQuery,
  Collection,
  CreateAssetInput,
  CreateCollectionInput,
  CreateTagInput,
  Device,
  IpcResult,
  RecentAsset,
  Setting,
  SettingsMap,
  Tag,
  UpdateAssetInput,
  UpdateCollectionInput,
  UpdateTagInput
} from '../../shared/types'
import type { AppEventName } from '../../shared/constants'

export interface LumoSyncApi {
  assets: {
    list: (query?: AssetListQuery) => Promise<IpcResult<Asset[]>>
    get: (id: string) => Promise<IpcResult<Asset>>
    create: (input: CreateAssetInput) => Promise<IpcResult<Asset>>
    update: (id: string, input: UpdateAssetInput) => Promise<IpcResult<Asset>>
    delete: (id: string) => Promise<IpcResult<{ id: string }>>
    restore: (id: string) => Promise<IpcResult<Asset>>
  }
  collections: {
    list: () => Promise<IpcResult<Collection[]>>
    get: (id: string) => Promise<IpcResult<Collection>>
    create: (input: CreateCollectionInput) => Promise<IpcResult<Collection>>
    update: (id: string, input: UpdateCollectionInput) => Promise<IpcResult<Collection>>
    delete: (id: string) => Promise<IpcResult<{ id: string }>>
    addAsset: (
      collectionId: string,
      assetId: string
    ) => Promise<IpcResult<{ collectionId: string; assetId: string }>>
    removeAsset: (
      collectionId: string,
      assetId: string
    ) => Promise<IpcResult<{ collectionId: string; assetId: string }>>
    listAssets: (id: string) => Promise<IpcResult<string[]>>
  }
  tags: {
    list: () => Promise<IpcResult<Tag[]>>
    create: (input: CreateTagInput) => Promise<IpcResult<Tag>>
    update: (id: string, input: UpdateTagInput) => Promise<IpcResult<Tag>>
    delete: (id: string) => Promise<IpcResult<{ id: string }>>
  }
  search: {
    query: (query: string, options?: { type?: Asset['type']; limit?: number }) => Promise<
      IpcResult<Asset[]>
    >
  }
  recent: {
    list: (limit?: number) => Promise<IpcResult<RecentAsset[]>>
    track: (assetId: string) => Promise<IpcResult<RecentAsset>>
  }
  settings: {
    get: (key: string) => Promise<IpcResult<string | null>>
    getAll: () => Promise<IpcResult<SettingsMap>>
    update: (key: string, value: string) => Promise<IpcResult<Setting>>
  }
  device: {
    getCurrent: () => Promise<IpcResult<Device>>
  }
  events: {
    on: (event: AppEventName, handler: (payload: unknown) => void) => () => void
  }
}

declare global {
  interface Window {
    lumosync: LumoSyncApi
  }
}

export {}
