import type { SqliteDatabase } from '../connection'
import { withTransaction } from '../connection'
import { createLogger } from '../../logging/logger'
import { loadMigrations } from './index'

const log = createLogger('migrations')

const SCHEMA_VERSION_KEY = 'schema_version'
const LAST_MIGRATION_KEY = 'last_migration'

function ensureMetadataTable(db: SqliteDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
}

function getSchemaVersion(db: SqliteDatabase): number {
  ensureMetadataTable(db)
  const row = db
    .prepare('SELECT value FROM app_metadata WHERE key = ?')
    .get(SCHEMA_VERSION_KEY) as { value: string } | undefined
  return row ? Number.parseInt(row.value, 10) : 0
}

function setSchemaVersion(db: SqliteDatabase, version: number, migrationName: string): void {
  const upsert = db.prepare(`
    INSERT INTO app_metadata (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `)
  upsert.run(SCHEMA_VERSION_KEY, String(version))
  upsert.run(LAST_MIGRATION_KEY, migrationName)
}

export function runMigrations(db: SqliteDatabase): void {
  const current = getSchemaVersion(db)
  const migrations = loadMigrations().filter((m) => m.version > current)

  if (migrations.length === 0) {
    log.info({ current }, 'Database schema is up to date')
    return
  }

  for (const migration of migrations) {
    log.info({ migration: migration.name }, 'Applying migration')

    try {
      withTransaction(db, () => {
        db.exec(migration.sql)
        setSchemaVersion(db, migration.version, migration.name)
      })
      log.info({ migration: migration.name, version: migration.version }, 'Migration completed')
    } catch (error) {
      log.error({ err: error, migration: migration.name }, 'Migration failed')
      throw error
    }
  }
}
