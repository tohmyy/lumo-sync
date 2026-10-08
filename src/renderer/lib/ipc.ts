import type {
  Asset,
  AssetListQuery,
  CreateAssetInput,
  UpdateAssetInput
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
