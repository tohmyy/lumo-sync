import type {
  Asset,
  AssetListQuery,
  CollectionWithCount,
  CreateAssetInput,
  CreateCollectionInput,
  CreateTagInput,
  RecentAsset,
  Tag,
  UpdateAssetInput,
  UpdateCollectionInput,
  UpdateTagInput
} from '../../shared/types'
import { unwrapIpc } from './query-client'

export const assetsApi = {
  list: (query?: AssetListQuery): Promise<Asset[]> =>
    unwrapIpc(window.lumosync.assets.list(query)),
  get: (id: string): Promise<Asset> => unwrapIpc(window.lumosync.assets.get(id)),
  create: (input: CreateAssetInput): Promise<Asset> =>
    unwrapIpc(window.lumosync.assets.create(input)),
  update: (id: string, input: UpdateAssetInput): Promise<Asset> =>
    unwrapIpc(window.lumosync.assets.update(id, input)),
  delete: (id: string): Promise<{ id: string }> =>
    unwrapIpc(window.lumosync.assets.delete(id)),
  restore: (id: string): Promise<Asset> => unwrapIpc(window.lumosync.assets.restore(id))
}

export const collectionsApi = {
  list: (): Promise<CollectionWithCount[]> => unwrapIpc(window.lumosync.collections.list()),
  get: (id: string) => unwrapIpc(window.lumosync.collections.get(id)),
  create: (input: CreateCollectionInput) => unwrapIpc(window.lumosync.collections.create(input)),
  update: (id: string, input: UpdateCollectionInput) =>
    unwrapIpc(window.lumosync.collections.update(id, input)),
  delete: (id: string) => unwrapIpc(window.lumosync.collections.delete(id)),
  addAsset: (collectionId: string, assetId: string) =>
    unwrapIpc(window.lumosync.collections.addAsset(collectionId, assetId)),
  removeAsset: (collectionId: string, assetId: string) =>
    unwrapIpc(window.lumosync.collections.removeAsset(collectionId, assetId)),
  listAssets: (id: string) => unwrapIpc(window.lumosync.collections.listAssets(id))
}

export const tagsApi = {
  list: (): Promise<Tag[]> => unwrapIpc(window.lumosync.tags.list()),
  create: (input: CreateTagInput) => unwrapIpc(window.lumosync.tags.create(input)),
  update: (id: string, input: UpdateTagInput) => unwrapIpc(window.lumosync.tags.update(id, input)),
  delete: (id: string) => unwrapIpc(window.lumosync.tags.delete(id))
}

export const recentApi = {
  list: (limit?: number): Promise<RecentAsset[]> => unwrapIpc(window.lumosync.recent.list(limit)),
  track: (assetId: string): Promise<RecentAsset> => unwrapIpc(window.lumosync.recent.track(assetId))
}
