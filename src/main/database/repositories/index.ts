import type { SqliteDatabase } from '../connection'
import { AssetRepository } from './asset.repository'
import { CollectionRepository } from './collection.repository'
import { DeviceRepository } from './device.repository'
import { RecentRepository } from './recent.repository'
import { SettingsRepository } from './settings.repository'
import { TagRepository } from './tag.repository'

export interface Repositories {
  assets: AssetRepository
  collections: CollectionRepository
  tags: TagRepository
  recent: RecentRepository
  settings: SettingsRepository
  devices: DeviceRepository
}

export function createRepositories(db: SqliteDatabase): Repositories {
  return {
    assets: new AssetRepository(db),
    collections: new CollectionRepository(db),
    tags: new TagRepository(db),
    recent: new RecentRepository(db),
    settings: new SettingsRepository(db),
    devices: new DeviceRepository(db)
  }
}

export {
  AssetRepository,
  CollectionRepository,
  TagRepository,
  RecentRepository,
  SettingsRepository,
  DeviceRepository
}
