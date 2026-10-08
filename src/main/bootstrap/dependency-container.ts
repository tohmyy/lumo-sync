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

const log = createLogger('container')

export interface AppContainer {
  db: SqliteDatabase
  repos: Repositories
  services: Services
  events: EventBus
}

function resolveDatabasePath(): string {
  const useDevDb = process.env.LUMOSYNC_DEV_DB === 'true' || !app.isPackaged
  if (useDevDb) {
    return join(process.cwd(), 'data', 'lumosync.db')
  }
  return join(app.getPath('userData'), 'database', 'lumosync.db')
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
  log.info({ dbPath }, 'Opening database')

  const db = openDatabase({ path: dbPath })
  runMigrations(db)

  const repos = createRepositories(db)
  const events = new EventBus()
  const services = createServices(repos, events)

  initializeFirstRun(db, repos)
  registerIpcHandlers(services)

  return { db, repos, services, events }
}
