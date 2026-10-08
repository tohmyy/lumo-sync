import type { SqliteDatabase } from '../database/connection'
import type { SyncStatus } from '../../shared/types'
import { nowIso } from '../../shared/utils'

export class SyncStateStore {
  constructor(private readonly db: SqliteDatabase) {}

  get(key: string): string | null {
    const row = this.db
      .prepare('SELECT value FROM sync_state WHERE key = ?')
      .get(key) as { value: string | null } | undefined
    return row?.value ?? null
  }

  set(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO sync_state (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .run(key, value)
  }

  getStatus(): SyncStatus {
    return (this.get('sync_status') as SyncStatus) ?? 'idle'
  }

  setStatus(status: SyncStatus): void {
    this.set('sync_status', status)
  }

  getCursor(): string | null {
    return this.get('last_pull_cursor')
  }

  setCursor(cursor: string): void {
    this.set('last_pull_cursor', cursor)
  }

  markAttempt(error?: string): void {
    this.set('last_sync_attempt_at', nowIso())
    if (error) {
      this.set('last_sync_error', error)
    } else {
      this.set('last_sync_error', '')
    }
  }

  markSuccess(): void {
    const now = nowIso()
    this.set('last_successful_sync_at', now)
    this.set('last_sync_attempt_at', now)
    this.set('last_sync_error', '')
    this.setStatus('synced')
  }
}
