import type { SqliteDatabase } from '../database/connection'
import type { ConflictResolution, SyncConflictRecord, SyncEntityType } from '../../shared/types'
import { createId, nowIso } from '../../shared/utils'

export class ConflictStore {
  constructor(private readonly db: SqliteDatabase) {}

  listUnresolved(): SyncConflictRecord[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM sync_conflicts WHERE resolution IS NULL ORDER BY detected_at DESC`
      )
      .all() as Array<Record<string, unknown>>
    return rows.map(mapConflict)
  }

  countUnresolved(): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) AS c FROM sync_conflicts WHERE resolution IS NULL`)
      .get() as { c: number }
    return row.c
  }

  create(input: {
    entityType: SyncEntityType
    entityId: string
    localVersion: number | null
    remoteVersion: number | null
    localPayload: string
    remotePayload: string
  }): SyncConflictRecord {
    const id = createId()
    const detectedAt = nowIso()
    this.db
      .prepare(
        `INSERT INTO sync_conflicts (
          id, entity_type, entity_id, local_version, remote_version,
          local_payload, remote_payload, detected_at, resolution, resolved_at, resolved_by_device_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`
      )
      .run(
        id,
        input.entityType,
        input.entityId,
        input.localVersion,
        input.remoteVersion,
        input.localPayload,
        input.remotePayload,
        detectedAt
      )
    return this.getById(id)!
  }

  getById(id: string): SyncConflictRecord | null {
    const row = this.db.prepare('SELECT * FROM sync_conflicts WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    return row ? mapConflict(row) : null
  }

  resolve(id: string, resolution: ConflictResolution, deviceId: string): SyncConflictRecord {
    const now = nowIso()
    this.db
      .prepare(
        `UPDATE sync_conflicts
         SET resolution = ?, resolved_at = ?, resolved_by_device_id = ?
         WHERE id = ?`
      )
      .run(resolution, now, deviceId, id)
    return this.getById(id)!
  }
}

function mapConflict(row: Record<string, unknown>): SyncConflictRecord {
  return {
    id: String(row.id),
    entityType: row.entity_type as SyncEntityType,
    entityId: String(row.entity_id),
    localVersion: (row.local_version as number | null) ?? null,
    remoteVersion: (row.remote_version as number | null) ?? null,
    localPayload: String(row.local_payload),
    remotePayload: String(row.remote_payload),
    detectedAt: String(row.detected_at),
    resolution: (row.resolution as string | null) ?? null,
    resolvedAt: (row.resolved_at as string | null) ?? null,
    resolvedByDeviceId: (row.resolved_by_device_id as string | null) ?? null
  }
}
