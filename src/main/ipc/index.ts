import type { Services } from '../services'
import { registerAssetHandlers } from './assets.handlers'
import { registerCollectionHandlers } from './collections.handlers'
import { registerDeviceHandlers } from './device.handlers'
import { registerRecentHandlers } from './recent.handlers'
import { registerSearchHandlers } from './search.handlers'
import { registerSettingsHandlers } from './settings.handlers'
import { registerSyncHandlers } from './sync.handlers'
import { registerTagHandlers } from './tags.handlers'
import { createLogger } from '../logging/logger'

const log = createLogger('ipc')

export function registerIpcHandlers(services: Services): void {
  registerAssetHandlers(services)
  registerCollectionHandlers(services)
  registerTagHandlers(services)
  registerSearchHandlers(services)
  registerRecentHandlers(services)
  registerSettingsHandlers(services)
  registerDeviceHandlers(services)
  registerSyncHandlers(services)
  log.info('IPC handlers registered')
}

export { EventBus } from './event-bus'
