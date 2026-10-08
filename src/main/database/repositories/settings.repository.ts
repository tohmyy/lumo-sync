import type { Setting, SettingsMap } from '../../../shared/types'
import { nowIso } from '../../../shared/utils'
import type { SqliteDatabase } from '../connection'

export class SettingsRepository {
  constructor(private readonly db: SqliteDatabase) {}

  get(key: string): string | null {
    const row = this.db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined
    return row?.value ?? null
  }

  getAll(): SettingsMap {
    const rows = this.db.prepare('SELECT key, value FROM settings').all() as Array<{
      key: string
      value: string
    }>
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  }

  set(key: string, value: string): Setting {
    const updatedAt = nowIso()
    this.db
      .prepare(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      )
      .run(key, value, updatedAt)

    return { key, value, updatedAt }
  }

  setMany(entries: Record<string, string>): void {
    const stmt = this.db.prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    const now = nowIso()
    const tx = this.db.transaction(() => {
      for (const [key, value] of Object.entries(entries)) {
        stmt.run(key, value, now)
      }
    })
    tx()
  }
}
