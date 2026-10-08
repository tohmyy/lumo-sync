import type {
  Asset,
  AssetListQuery,
  CreateAssetInput,
  UpdateAssetInput
} from '../../shared/types'
import type { Repositories } from '../database/repositories'
import type { EventBus } from '../ipc/event-bus'
import { AppEvents } from '../../shared/constants'

export class AssetService {
  constructor(
    private readonly repos: Repositories,
    private readonly events: EventBus
  ) {}

  private deviceId(): string {
    const device = this.repos.devices.getCurrent()
    if (!device) {
      throw new Error('Current device is not initialized')
    }
    return device.id
  }

  list(query?: AssetListQuery): Asset[] {
    return this.repos.assets.list(query ?? {})
  }

  get(id: string): Asset {
    return this.repos.assets.getByIdOrThrow(id)
  }

  create(input: CreateAssetInput): Asset {
    const asset = this.repos.assets.create(input, this.deviceId())
    this.events.emit(AppEvents.assetUpdated, { id: asset.id })
    return asset
  }

  update(id: string, input: UpdateAssetInput): Asset {
    const asset = this.repos.assets.update(id, input, this.deviceId())
    this.events.emit(AppEvents.assetUpdated, { id: asset.id })
    return asset
  }

  delete(id: string): void {
    this.repos.assets.softDelete(id, this.deviceId())
    this.events.emit(AppEvents.assetDeleted, { id })
  }

  restore(id: string): Asset {
    const asset = this.repos.assets.restore(id, this.deviceId())
    this.events.emit(AppEvents.assetUpdated, { id: asset.id })
    return asset
  }

  search(query: string, limit?: number): Asset[] {
    return this.repos.assets.search(query, limit)
  }
}
