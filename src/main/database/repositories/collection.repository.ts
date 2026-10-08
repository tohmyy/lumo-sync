import type {
  Collection,
  CollectionWithCount,
  CreateCollectionInput,
  UpdateCollectionInput
} from '../../../shared/types'
import { AppErrorException } from '../../../shared/errors'
import { createId, normalizeName, nowIso } from '../../../shared/utils'
import type { SqliteDatabase } from '../connection'
import { withTransaction } from '../connection'
import { mapCollection, type CollectionRow } from '../mappers'

export class CollectionRepository {
  constructor(private readonly db: SqliteDatabase) {}

  create(input: CreateCollectionInput, deviceId: string): Collection {
    this.assertUniqueName(input.name)

    const id = createId()
    const now = nowIso()

    this.db
      .prepare(
        `INSERT INTO collections (
          id, name, description, created_at, updated_at, deleted_at,
          created_by_device_id, updated_by_device_id
        ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`
      )
      .run(id, input.name.trim(), input.description ?? null, now, now, deviceId, deviceId)

    return this.getByIdOrThrow(id)
  }

  getById(id: string): Collection | null {
    const row = this.db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as
      | CollectionRow
      | undefined
    return row ? mapCollection(row) : null
  }

  getByIdOrThrow(id: string): Collection {
    const collection = this.getById(id)
    if (!collection) {
      throw new AppErrorException('COLLECTION_NOT_FOUND', 'Collection not found', { id })
    }
    return collection
  }

  list(includeDeleted = false): Collection[] {
    const sql = includeDeleted
      ? 'SELECT * FROM collections ORDER BY name COLLATE NOCASE'
      : 'SELECT * FROM collections WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE'
    const rows = this.db.prepare(sql).all() as CollectionRow[]
    return rows.map(mapCollection)
  }

  listWithCounts(includeDeleted = false): CollectionWithCount[] {
    const deletedClause = includeDeleted ? '' : 'WHERE c.deleted_at IS NULL'
    const rows = this.db
      .prepare(
        `SELECT c.*,
                (
                  SELECT COUNT(*)
                  FROM collection_assets ca
                  JOIN assets a ON a.id = ca.asset_id AND a.deleted_at IS NULL
                  WHERE ca.collection_id = c.id
                ) AS asset_count
         FROM collections c
         ${deletedClause}
         ORDER BY c.name COLLATE NOCASE`
      )
      .all() as Array<CollectionRow & { asset_count: number }>

    return rows.map((row) => ({
      ...mapCollection(row),
      assetCount: row.asset_count
    }))
  }

  update(id: string, input: UpdateCollectionInput, deviceId: string): Collection {
    const existing = this.getByIdOrThrow(id)
    if (existing.deletedAt) {
      throw new AppErrorException('COLLECTION_NOT_FOUND', 'Cannot update a deleted collection', {
        id
      })
    }

    if (input.name !== undefined) {
      this.assertUniqueName(input.name, id)
    }

    const now = nowIso()
    const name = input.name?.trim() ?? existing.name
    const description =
      input.description !== undefined ? input.description : existing.description

    this.db
      .prepare(
        `UPDATE collections SET
          name = ?, description = ?, updated_at = ?, updated_by_device_id = ?
        WHERE id = ?`
      )
      .run(name, description, now, deviceId, id)

    return this.getByIdOrThrow(id)
  }

  softDelete(id: string, deviceId: string): void {
    const existing = this.getByIdOrThrow(id)
    if (existing.deletedAt) return

    const now = nowIso()
    this.db
      .prepare(
        `UPDATE collections SET deleted_at = ?, updated_at = ?, updated_by_device_id = ?
         WHERE id = ?`
      )
      .run(now, now, deviceId, id)
  }

  addAsset(collectionId: string, assetId: string): void {
    this.getByIdOrThrow(collectionId)
    withTransaction(this.db, () => {
      this.db
        .prepare(
          `INSERT OR IGNORE INTO collection_assets (collection_id, asset_id, created_at)
           VALUES (?, ?, ?)`
        )
        .run(collectionId, assetId, nowIso())
    })
  }

  removeAsset(collectionId: string, assetId: string): void {
    this.db
      .prepare('DELETE FROM collection_assets WHERE collection_id = ? AND asset_id = ?')
      .run(collectionId, assetId)
  }

  listAssetIds(collectionId: string): string[] {
    const rows = this.db
      .prepare(
        `SELECT asset_id FROM collection_assets WHERE collection_id = ? ORDER BY created_at DESC`
      )
      .all(collectionId) as Array<{ asset_id: string }>
    return rows.map((r) => r.asset_id)
  }

  private assertUniqueName(name: string, excludeId?: string): void {
    const normalized = normalizeName(name)
    const rows = this.db
      .prepare(`SELECT id, name FROM collections WHERE deleted_at IS NULL`)
      .all() as Array<{ id: string; name: string }>

    const conflict = rows.find(
      (row) => normalizeName(row.name) === normalized && row.id !== excludeId
    )
    if (conflict) {
      throw new AppErrorException('VALIDATION_ERROR', 'A collection with this name already exists', {
        name
      })
    }
  }
}
