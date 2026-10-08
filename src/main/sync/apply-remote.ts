import type { SqliteDatabase } from '../database/connection'
import { withTransaction } from '../database/connection'
import type { AssetType, RemoteSyncOperation } from '../../shared/types'
import { createId, nowIso } from '../../shared/utils'
import { ConflictStore } from './conflict-store'
import { createLogger } from '../logging/logger'

const log = createLogger('apply-remote')

interface AssetPayload {
  id: string
  type: AssetType
  title: string
  description: string | null
  language: string | null
  content: string
  isFavorite: boolean
  version: number
  deletedAt: string | null
  tags?: string[]
}

export function applyRemoteOperations(
  db: SqliteDatabase,
  conflicts: ConflictStore,
  operations: RemoteSyncOperation[],
  localDeviceId: string
): { applied: number; conflictsCreated: number } {
  let applied = 0
  let conflictsCreated = 0

  for (const op of operations) {
    if (op.deviceId === localDeviceId) {
      continue
    }
    if (op.entityType !== 'asset') {
      continue
    }

    try {
      const result = applyAssetOperation(db, conflicts, op)
      if (result === 'applied') applied += 1
      if (result === 'conflict') conflictsCreated += 1
    } catch (error) {
      log.error({ err: error, opId: op.id }, 'Failed to apply remote operation')
    }
  }

  return { applied, conflictsCreated }
}

function applyAssetOperation(
  db: SqliteDatabase,
  conflicts: ConflictStore,
  op: RemoteSyncOperation
): 'applied' | 'conflict' | 'skipped' {
  const payload = JSON.parse(op.payload) as AssetPayload
  const existing = db.prepare('SELECT * FROM assets WHERE id = ?').get(op.entityId) as
    | {
        id: string
        version: number
        title: string
        description: string | null
        language: string | null
        content: string
        is_favorite: number
        type: string
        deleted_at: string | null
      }
    | undefined

  // Concurrent divergence: local is not at the version this remote op expected.
  // Equal version numbers from independent edits still conflict when content differs.
  if (existing && op.baseVersion !== null && existing.version !== op.baseVersion) {
    const sameContent =
      existing.title === payload.title &&
      existing.content === payload.content &&
      existing.description === payload.description &&
      existing.language === payload.language &&
      (existing.is_favorite === 1) === payload.isFavorite &&
      existing.deleted_at === payload.deletedAt

    if (!sameContent) {
      const localPayload = JSON.stringify({
        id: existing.id,
        type: existing.type,
        title: existing.title,
        description: existing.description,
        language: existing.language,
        content: existing.content,
        isFavorite: existing.is_favorite === 1,
        version: existing.version,
        deletedAt: existing.deleted_at,
        tags: []
      })
      conflicts.create({
        entityType: 'asset',
        entityId: op.entityId,
        localVersion: existing.version,
        remoteVersion: payload.version,
        localPayload,
        remotePayload: op.payload
      })
      return 'conflict'
    }
  }

  withTransaction(db, () => {
    if (op.operation === 'delete') {
      if (!existing) return
      db.prepare(
        `UPDATE assets SET deleted_at = ?, version = ?, updated_at = ? WHERE id = ?`
      ).run(payload.deletedAt ?? nowIso(), payload.version, nowIso(), op.entityId)
      db.prepare('DELETE FROM asset_search WHERE asset_id = ?').run(op.entityId)
      return
    }

    if (!existing) {
      db.prepare(
        `INSERT INTO assets (
          id, type, title, description, language, content, is_favorite, version,
          created_at, updated_at, deleted_at, created_by_device_id, updated_by_device_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.type,
        payload.title,
        payload.description,
        payload.language,
        payload.content,
        payload.isFavorite ? 1 : 0,
        payload.version,
        nowIso(),
        nowIso(),
        payload.deletedAt,
        op.deviceId,
        op.deviceId
      )
    } else {
      if (payload.version < existing.version) {
        return
      }
      db.prepare(
        `UPDATE assets SET
          type = ?, title = ?, description = ?, language = ?, content = ?,
          is_favorite = ?, version = ?, updated_at = ?, deleted_at = ?, updated_by_device_id = ?
         WHERE id = ?`
      ).run(
        payload.type,
        payload.title,
        payload.description,
        payload.language,
        payload.content,
        payload.isFavorite ? 1 : 0,
        payload.version,
        nowIso(),
        payload.deletedAt,
        op.deviceId,
        op.entityId
      )
      db.prepare('DELETE FROM asset_search WHERE asset_id = ?').run(op.entityId)
    }

    if (!payload.deletedAt) {
      db.prepare(
        `INSERT INTO asset_search (asset_id, title, description, content, language)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        payload.id,
        payload.title,
        payload.description ?? '',
        payload.content,
        payload.language ?? ''
      )
    }

    if (payload.tags) {
      db.prepare('DELETE FROM asset_tags WHERE asset_id = ?').run(payload.id)
      for (const raw of payload.tags) {
        const name = raw.trim()
        if (!name) continue
        const normalized = name.toLowerCase()
        let tag = db
          .prepare(`SELECT id FROM tags WHERE normalized_name = ? AND deleted_at IS NULL`)
          .get(normalized) as { id: string } | undefined
        if (!tag) {
          const tagId = createId()
          const now = nowIso()
          db.prepare(
            `INSERT INTO tags (id, name, normalized_name, created_at, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, ?, NULL)`
          ).run(tagId, name, normalized, now, now)
          tag = { id: tagId }
        }
        db.prepare(
          `INSERT OR IGNORE INTO asset_tags (asset_id, tag_id, created_at) VALUES (?, ?, ?)`
        ).run(payload.id, tag.id, nowIso())
      }
    }
  })

  return 'applied'
}
