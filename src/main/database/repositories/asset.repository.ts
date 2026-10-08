import type {
  Asset,
  AssetListQuery,
  CreateAssetInput,
  UpdateAssetInput
} from '../../../shared/types'
import { AppErrorException } from '../../../shared/errors'
import { createId, nowIso } from '../../../shared/utils'
import type { SqliteDatabase } from '../connection'
import { withTransaction } from '../connection'
import { mapAsset, type AssetRow } from '../mappers'
import { enqueueAssetSyncOperation, type SyncAssetOperation } from '../sync-operations'

export class AssetRepository {
  constructor(private readonly db: SqliteDatabase) {}

  create(input: CreateAssetInput, deviceId: string): Asset {
    const id = createId()
    const now = nowIso()
    const isFavorite = input.isFavorite ? 1 : 0

    return withTransaction(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO assets (
            id, type, title, description, language, content,
            is_favorite, version, created_at, updated_at, deleted_at,
            created_by_device_id, updated_by_device_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL, ?, ?)`
        )
        .run(
          id,
          input.type,
          input.title,
          input.description ?? null,
          input.language ?? null,
          input.content,
          isFavorite,
          now,
          now,
          deviceId,
          deviceId
        )

      this.insertRevision({
        assetId: id,
        version: 1,
        operation: 'create',
        title: input.title,
        description: input.description ?? null,
        language: input.language ?? null,
        content: input.content,
        isFavorite,
        deviceId,
        createdAt: now
      })

      this.upsertSearch({
        assetId: id,
        title: input.title,
        description: input.description ?? null,
        content: input.content,
        language: input.language ?? null
      })

      if (input.tags?.length) {
        this.syncTags(id, input.tags, now)
      }

      const asset = this.getByIdOrThrow(id)
      this.enqueueSync(asset, 'create', null)
      return asset
    })
  }

  getById(id: string): Asset | null {
    const row = this.db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as AssetRow | undefined
    return row ? this.toAsset(row) : null
  }

  getByIdOrThrow(id: string): Asset {
    const asset = this.getById(id)
    if (!asset) {
      throw new AppErrorException('ASSET_NOT_FOUND', 'Asset not found', { id })
    }
    return asset
  }

  list(query: AssetListQuery = {}): Asset[] {
    if (query.search?.trim()) {
      return this.listWithSearch(query)
    }

    const clauses: string[] = []
    const params: unknown[] = []

    if (!query.includeDeleted) {
      clauses.push('deleted_at IS NULL')
    }
    if (query.type) {
      clauses.push('type = ?')
      params.push(query.type)
    }
    if (query.isFavorite !== undefined) {
      clauses.push('is_favorite = ?')
      params.push(query.isFavorite ? 1 : 0)
    }

    let sql = 'SELECT * FROM assets'
    if (clauses.length) {
      sql += ` WHERE ${clauses.join(' AND ')}`
    }
    sql += ' ORDER BY updated_at DESC'

    if (query.limit) {
      sql += ' LIMIT ?'
      params.push(query.limit)
      if (query.offset) {
        sql += ' OFFSET ?'
        params.push(query.offset)
      }
    }

    const rows = this.db.prepare(sql).all(...params) as AssetRow[]
    return rows.map((row) => this.toAsset(row))
  }

  update(id: string, input: UpdateAssetInput, deviceId: string): Asset {
    return withTransaction(this.db, () => {
      const existing = this.getByIdOrThrow(id)
      if (existing.deletedAt) {
        throw new AppErrorException('ASSET_NOT_FOUND', 'Cannot update a deleted asset', { id })
      }

      const next = {
        type: input.type ?? existing.type,
        title: input.title ?? existing.title,
        description: input.description !== undefined ? input.description : existing.description,
        language: input.language !== undefined ? input.language : existing.language,
        content: input.content ?? existing.content,
        isFavorite: input.isFavorite !== undefined ? input.isFavorite : existing.isFavorite
      }

      const version = existing.version + 1
      const now = nowIso()
      const isFavorite = next.isFavorite ? 1 : 0

      this.db
        .prepare(
          `UPDATE assets SET
            type = ?, title = ?, description = ?, language = ?, content = ?,
            is_favorite = ?, version = ?, updated_at = ?, updated_by_device_id = ?
          WHERE id = ?`
        )
        .run(
          next.type,
          next.title,
          next.description,
          next.language,
          next.content,
          isFavorite,
          version,
          now,
          deviceId,
          id
        )

      this.insertRevision({
        assetId: id,
        version,
        operation: 'update',
        title: next.title,
        description: next.description,
        language: next.language,
        content: next.content,
        isFavorite,
        deviceId,
        createdAt: now
      })

      this.db.prepare('DELETE FROM asset_search WHERE asset_id = ?').run(id)
      this.upsertSearch({
        assetId: id,
        title: next.title,
        description: next.description,
        content: next.content,
        language: next.language
      })

      if (input.tags !== undefined) {
        this.db.prepare('DELETE FROM asset_tags WHERE asset_id = ?').run(id)
        this.syncTags(id, input.tags, now)
      }

      const asset = this.getByIdOrThrow(id)
      this.enqueueSync(asset, 'update', existing.version)
      return asset
    })
  }

  softDelete(id: string, deviceId: string): void {
    withTransaction(this.db, () => {
      const existing = this.getByIdOrThrow(id)
      if (existing.deletedAt) {
        return
      }

      const version = existing.version + 1
      const now = nowIso()

      this.db
        .prepare(
          `UPDATE assets SET
            deleted_at = ?, version = ?, updated_at = ?, updated_by_device_id = ?
          WHERE id = ?`
        )
        .run(now, version, now, deviceId, id)

      this.insertRevision({
        assetId: id,
        version,
        operation: 'delete',
        title: existing.title,
        description: existing.description,
        language: existing.language,
        content: existing.content,
        isFavorite: existing.isFavorite ? 1 : 0,
        deviceId,
        createdAt: now
      })

      this.db.prepare('DELETE FROM asset_search WHERE asset_id = ?').run(id)

      const asset = this.getByIdOrThrow(id)
      this.enqueueSync(asset, 'delete', existing.version)
    })
  }

  restore(id: string, deviceId: string): Asset {
    return withTransaction(this.db, () => {
      const existing = this.getByIdOrThrow(id)
      if (!existing.deletedAt) {
        return existing
      }

      const version = existing.version + 1
      const now = nowIso()
      const isFavorite = existing.isFavorite ? 1 : 0

      this.db
        .prepare(
          `UPDATE assets SET
            deleted_at = NULL, version = ?, updated_at = ?, updated_by_device_id = ?
          WHERE id = ?`
        )
        .run(version, now, deviceId, id)

      this.insertRevision({
        assetId: id,
        version,
        operation: 'restore',
        title: existing.title,
        description: existing.description,
        language: existing.language,
        content: existing.content,
        isFavorite,
        deviceId,
        createdAt: now
      })

      this.upsertSearch({
        assetId: id,
        title: existing.title,
        description: existing.description,
        content: existing.content,
        language: existing.language
      })

      const asset = this.getByIdOrThrow(id)
      this.enqueueSync(asset, 'restore', existing.version)
      return asset
    })
  }

  search(query: string, limit = 50): Asset[] {
    return this.listWithSearch({ search: query, limit })
  }

  private listWithSearch(query: AssetListQuery): Asset[] {
    const search = query.search?.trim()
    if (!search) {
      return this.list({ ...query, search: undefined })
    }

    const clauses = ['asset_search MATCH ?']
    const params: unknown[] = [search]

    if (!query.includeDeleted) {
      clauses.push('a.deleted_at IS NULL')
    }
    if (query.type) {
      clauses.push('a.type = ?')
      params.push(query.type)
    }
    if (query.isFavorite !== undefined) {
      clauses.push('a.is_favorite = ?')
      params.push(query.isFavorite ? 1 : 0)
    }

    let sql = `
      SELECT a.*
      FROM asset_search
      JOIN assets a ON a.id = asset_search.asset_id
      WHERE ${clauses.join(' AND ')}
      ORDER BY rank
    `

    if (query.limit) {
      sql += ' LIMIT ?'
      params.push(query.limit)
      if (query.offset) {
        sql += ' OFFSET ?'
        params.push(query.offset)
      }
    }

    const rows = this.db.prepare(sql).all(...params) as AssetRow[]
    return rows.map((row) => this.toAsset(row))
  }

  private toAsset(row: AssetRow): Asset {
    return mapAsset(row, this.getTagNames(row.id))
  }

  private getTagNames(assetId: string): string[] {
    const rows = this.db
      .prepare(
        `SELECT t.name
         FROM asset_tags at
         JOIN tags t ON t.id = at.tag_id
         WHERE at.asset_id = ? AND t.deleted_at IS NULL
         ORDER BY t.name COLLATE NOCASE`
      )
      .all(assetId) as Array<{ name: string }>
    return rows.map((r) => r.name)
  }

  private enqueueSync(
    asset: Asset,
    operation: SyncAssetOperation,
    baseVersion: number | null
  ): void {
    enqueueAssetSyncOperation(this.db, { asset, operation, baseVersion })
  }

  private insertRevision(args: {
    assetId: string
    version: number
    operation: string
    title: string
    description: string | null
    language: string | null
    content: string
    isFavorite: number
    deviceId: string
    createdAt: string
  }): void {
    this.db
      .prepare(
        `INSERT INTO asset_revisions (
          id, asset_id, version, operation, title, description, language,
          content, is_favorite, created_at, device_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        createId(),
        args.assetId,
        args.version,
        args.operation,
        args.title,
        args.description,
        args.language,
        args.content,
        args.isFavorite,
        args.createdAt,
        args.deviceId
      )
  }

  private upsertSearch(args: {
    assetId: string
    title: string
    description: string | null
    content: string
    language: string | null
  }): void {
    this.db
      .prepare(
        `INSERT INTO asset_search (asset_id, title, description, content, language)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        args.assetId,
        args.title,
        args.description ?? '',
        args.content,
        args.language ?? ''
      )
  }

  private syncTags(assetId: string, tagNames: string[], now: string): void {
    const findTag = this.db.prepare(
      `SELECT id FROM tags WHERE normalized_name = ? AND deleted_at IS NULL`
    )
    const insertTag = this.db.prepare(
      `INSERT INTO tags (id, name, normalized_name, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, NULL)`
    )
    const link = this.db.prepare(
      `INSERT OR IGNORE INTO asset_tags (asset_id, tag_id, created_at) VALUES (?, ?, ?)`
    )

    for (const raw of tagNames) {
      const name = raw.trim()
      if (!name) continue
      const normalized = name.toLowerCase()
      const existing = findTag.get(normalized) as { id: string } | undefined
      let tagId = existing?.id
      if (!tagId) {
        tagId = createId()
        insertTag.run(tagId, name, normalized, now, now)
      }
      link.run(assetId, tagId, now)
    }
  }
}
