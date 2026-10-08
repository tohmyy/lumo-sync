import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { openDatabase, closeDatabase, type SqliteDatabase } from '../../src/main/database/connection'
import { runMigrations } from '../../src/main/database/migrations/runner'
import { createRepositories, type Repositories } from '../../src/main/database/repositories'

export interface TestDbContext {
  db: SqliteDatabase
  repos: Repositories
  dir: string
  path: string
  dispose: () => void
}

export function createTestDb(): TestDbContext {
  const dir = mkdtempSync(join(tmpdir(), 'lumosync-test-'))
  const path = join(dir, 'test.db')
  const db = openDatabase({ path })
  runMigrations(db)
  const repos = createRepositories(db)

  return {
    db,
    repos,
    dir,
    path,
    dispose: () => {
      closeDatabase(db)
      rmSync(dir, { recursive: true, force: true })
    }
  }
}

export function seedCurrentDevice(repos: Repositories): string {
  const device = repos.devices.createCurrent({
    name: 'Test Device',
    platform: 'windows',
    appVersion: '0.1.0'
  })
  return device.id
}
