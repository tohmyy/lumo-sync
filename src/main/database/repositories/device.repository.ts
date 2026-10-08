import type { Device, DevicePlatform } from '../../../shared/types'
import { createId, nowIso } from '../../../shared/utils'
import type { SqliteDatabase } from '../connection'
import { mapDevice, type DeviceRow } from '../mappers'

export class DeviceRepository {
  constructor(private readonly db: SqliteDatabase) {}

  getCurrent(): Device | null {
    const row = this.db
      .prepare('SELECT * FROM devices WHERE is_current = 1 LIMIT 1')
      .get() as DeviceRow | undefined
    return row ? mapDevice(row) : null
  }

  getById(id: string): Device | null {
    const row = this.db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as
      | DeviceRow
      | undefined
    return row ? mapDevice(row) : null
  }

  list(): Device[] {
    const rows = this.db
      .prepare('SELECT * FROM devices ORDER BY created_at ASC')
      .all() as DeviceRow[]
    return rows.map(mapDevice)
  }

  createCurrent(input: {
    name: string
    platform: DevicePlatform
    appVersion?: string
  }): Device {
    const existing = this.getCurrent()
    if (existing) {
      return existing
    }

    const id = createId()
    const now = nowIso()

    this.db
      .prepare(
        `INSERT INTO devices (
          id, name, platform, app_version, is_current, last_seen_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)`
      )
      .run(id, input.name, input.platform, input.appVersion ?? null, now, now, now)

    return this.getById(id)!
  }

  touchCurrent(): Device | null {
    const current = this.getCurrent()
    if (!current) return null

    const now = nowIso()
    this.db
      .prepare('UPDATE devices SET last_seen_at = ?, updated_at = ? WHERE id = ?')
      .run(now, now, current.id)

    return this.getById(current.id)
  }
}
