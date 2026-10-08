import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

export type SqliteDatabase = Database.Database

export interface OpenDatabaseOptions {
  path: string
  readonly?: boolean
}

export function openDatabase(options: OpenDatabaseOptions): SqliteDatabase {
  mkdirSync(dirname(options.path), { recursive: true })

  const db = new Database(options.path, {
    readonly: options.readonly ?? false
  })

  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('busy_timeout = 5000')

  return db
}

export function withTransaction<T>(db: SqliteDatabase, fn: () => T): T {
  const run = db.transaction(fn)
  return run()
}

export function closeDatabase(db: SqliteDatabase): void {
  db.close()
}
