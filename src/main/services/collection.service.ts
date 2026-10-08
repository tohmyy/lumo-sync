import type {
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput
} from '../../shared/types'
import type { Repositories } from '../database/repositories'

export class CollectionService {
  constructor(private readonly repos: Repositories) {}

  private deviceId(): string {
    const device = this.repos.devices.getCurrent()
    if (!device) {
      throw new Error('Current device is not initialized')
    }
    return device.id
  }

  list(): Collection[] {
    return this.repos.collections.list()
  }

  get(id: string): Collection {
    return this.repos.collections.getByIdOrThrow(id)
  }

  create(input: CreateCollectionInput): Collection {
    return this.repos.collections.create(input, this.deviceId())
  }

  update(id: string, input: UpdateCollectionInput): Collection {
    return this.repos.collections.update(id, input, this.deviceId())
  }

  delete(id: string): void {
    this.repos.collections.softDelete(id, this.deviceId())
  }

  addAsset(collectionId: string, assetId: string): void {
    this.repos.assets.getByIdOrThrow(assetId)
    this.repos.collections.addAsset(collectionId, assetId)
  }

  removeAsset(collectionId: string, assetId: string): void {
    this.repos.collections.removeAsset(collectionId, assetId)
  }

  listAssets(collectionId: string): string[] {
    return this.repos.collections.listAssetIds(collectionId)
  }
}
