import { hostname } from 'os'
import { join } from 'path'
import { app } from 'electron'
import { openDatabase, type SqliteDatabase } from '../database/connection'
import { runMigrations } from '../database/migrations/runner'
import { createRepositories, type Repositories } from '../database/repositories'
import { EventBus, registerIpcHandlers } from '../ipc'
import { createServices, type Services } from '../services'
import { createLogger } from '../logging/logger'
import { createId, nowIso } from '../../shared/utils'
import type { DevicePlatform } from '../../shared/types'
import { FileRemoteClient, SyncEngine, SyncScheduler } from '../sync'

const log = createLogger('container')

export interface AppContainer {
  db: SqliteDatabase
  repos: Repositories
  services: Services
  events: EventBus
  syncEngine: SyncEngine
  syncScheduler: SyncScheduler
}

function resolveDatabasePath(): string {
  const useDevDb = process.env.LUMOSYNC_DEV_DB === 'true' || !app.isPackaged
  if (useDevDb) {
    return join(process.cwd(), 'data', 'lumosync.db')
  }
  return join(app.getPath('userData'), 'database', 'lumosync.db')
}

function resolveSyncStorePath(): string {
  if (process.env.LUMOSYNC_SYNC_STORE) {
    return process.env.LUMOSYNC_SYNC_STORE
  }
  const useDev = process.env.LUMOSYNC_DEV_DB === 'true' || !app.isPackaged
  if (useDev) {
    return join(process.cwd(), 'data', 'sync-store.json')
  }
  return join(app.getPath('userData'), 'sync', 'sync-store.json')
}

function mapPlatform(): DevicePlatform {
  switch (process.platform) {
    case 'darwin':
      return 'macos'
    case 'win32':
      return 'windows'
    default:
      return 'linux'
  }
}

function writeMetadataIfAbsent(db: SqliteDatabase, key: string, value: string): void {
  db.prepare(
    `INSERT INTO app_metadata (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO NOTHING`
  ).run(key, value)
}

function initializeFirstRun(db: SqliteDatabase, repos: Repositories): void {
  const current = repos.devices.getCurrent()
  if (current) {
    repos.devices.touchCurrent()
    log.info({ deviceId: current.id }, 'Current device loaded')
    return
  }

  const device = repos.devices.createCurrent({
    name: hostname() || 'LumoSync Device',
    platform: mapPlatform(),
    appVersion: app.getVersion()
  })

  repos.settings.setMany({
    theme: 'system',
    editor_font_size: '14',
    editor_word_wrap: 'true',
    sidebar_collapsed: 'false',
    default_asset_type: 'snippet'
  })

  writeMetadataIfAbsent(db, 'installation_id', createId())
  writeMetadataIfAbsent(db, 'database_created_at', nowIso())

  log.info({ deviceId: device.id }, 'Created current device on first launch')
}

export function createContainer(): AppContainer {
  const dbPath = resolveDatabasePath()
  const syncStorePath = resolveSyncStorePath()
  log.info({ dbPath, syncStorePath }, 'Opening database and sync store')

  const db = openDatabase({ path: dbPath })
  runMigrations(db)

  const repos = createRepositories(db)
  const events = new EventBus()
  const remote = new FileRemoteClient(syncStorePath)
  const syncEngine = new SyncEngine(db, repos, remote, events)
  const syncScheduler = new SyncScheduler(syncEngine)

  const services = createServices(repos, events, {
    engine: syncEngine,
    scheduler: syncScheduler,
    remote
  })

  initializeFirstRun(db, repos)
  registerIpcHandlers(services)
  syncScheduler.start()

  return { db, repos, services, events, syncEngine, syncScheduler }
}
