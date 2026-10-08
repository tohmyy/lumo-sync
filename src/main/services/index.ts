import type { Repositories } from '../database/repositories'
import type { EventBus } from '../ipc/event-bus'
import { AssetService } from './asset.service'
import { CollectionService } from './collection.service'
import { DeviceService } from './device.service'
import { RecentService } from './recent.service'
import { SearchService } from './search.service'
import { SettingsService } from './settings.service'
import { TagService } from './tag.service'

export interface Services {
  assets: AssetService
  collections: CollectionService
  tags: TagService
  search: SearchService
  recent: RecentService
  settings: SettingsService
  devices: DeviceService
}

export function createServices(repos: Repositories, events: EventBus): Services {
  return {
    assets: new AssetService(repos, events),
    collections: new CollectionService(repos),
    tags: new TagService(repos),
    search: new SearchService(repos),
    recent: new RecentService(repos),
    settings: new SettingsService(repos),
    devices: new DeviceService(repos)
  }
}
