import type { Asset } from '../../shared/types'
import { createId, nowIso } from '../../shared/utils'
import type { SqliteDatabase } from './connection'

export type SyncAssetOperation = 'create' | 'update' | 'delete' | 'restore'

export function enqueueAssetSyncOperation(
  db: SqliteDatabase,
  args: {
    asset: Asset
    operation: SyncAssetOperation
    baseVersion: number | null
  }
): void {
  const payload = JSON.stringify({
    id: args.asset.id,
    type: args.asset.type,
    title: args.asset.title,
    description: args.asset.description,
    language: args.asset.language,
    content: args.asset.content,
    isFavorite: args.asset.isFavorite,
    version: args.asset.version,
    deletedAt: args.asset.deletedAt,
    tags: args.asset.tags
  })

  db.prepare(
    `INSERT INTO sync_operations (
      id, entity_type, entity_id, operation, base_version, target_version,
      payload, created_at, status, attempt_count, last_attempt_at, last_error
    ) VALUES (?, 'asset', ?, ?, ?, ?, ?, ?, 'pending', 0, NULL, NULL)`
  ).run(
    createId(),
    args.asset.id,
    args.operation,
    args.baseVersion,
    args.asset.version,
    payload,
    nowIso()
  )
}
