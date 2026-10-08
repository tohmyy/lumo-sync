import type { Repositories } from '../database/repositories'
import type { EventBus } from '../ipc/event-bus'
import type { SyncEngine } from '../sync/sync-engine'
import type { SyncScheduler } from '../sync/sync-scheduler'
import type { SyncRemoteClient } from '../../shared/types'
import { AssetService } from './asset.service'
import { CollectionService } from './collection.service'
import { DeviceService } from './device.service'
import { RecentService } from './recent.service'
import { SearchService } from './search.service'
import { SettingsService } from './settings.service'
import { SyncService } from './sync.service'
import { TagService } from './tag.service'

export interface Services {
  assets: AssetService
  collections: CollectionService
  tags: TagService
  search: SearchService
  recent: RecentService
  settings: SettingsService
  devices: DeviceService
  sync: SyncService
}

export function createServices(
  repos: Repositories,
  events: EventBus,
  syncParts?: {
    engine: SyncEngine
    scheduler: SyncScheduler
    remote: SyncRemoteClient
  }
): Services {
  const assets = new AssetService(repos, events)
  const services: Services = {
    assets,
    collections: new CollectionService(repos),
    tags: new TagService(repos),
    search: new SearchService(repos),
    recent: new RecentService(repos),
    settings: new SettingsService(repos),
    devices: new DeviceService(repos),
    sync: null as unknown as SyncService
  }

  if (syncParts) {
    services.sync = new SyncService(
      syncParts.engine,
      syncParts.scheduler,
      syncParts.remote,
      repos
    )
    assets.setMutationHook(() => services.sync.scheduleAfterMutation())
  }

  return services
}
