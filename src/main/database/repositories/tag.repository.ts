import type { CreateTagInput, Tag, UpdateTagInput } from '../../../shared/types'
import { AppErrorException } from '../../../shared/errors'
import { createId, normalizeName, nowIso } from '../../../shared/utils'
import type { SqliteDatabase } from '../connection'
import { mapTag, type TagRow } from '../mappers'

export class TagRepository {
  constructor(private readonly db: SqliteDatabase) {}

  create(input: CreateTagInput): Tag {
    const name = input.name.trim()
    const normalized = normalizeName(name)
    const existing = this.findByNormalized(normalized)
    if (existing && !existing.deletedAt) {
      return existing
    }

    const id = createId()
    const now = nowIso()

    if (existing?.deletedAt) {
      this.db
        .prepare(
          `UPDATE tags SET name = ?, normalized_name = ?, updated_at = ?, deleted_at = NULL
           WHERE id = ?`
        )
        .run(name, normalized, now, existing.id)
      return this.getByIdOrThrow(existing.id)
    }

    this.db
      .prepare(
        `INSERT INTO tags (id, name, normalized_name, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, NULL)`
      )
      .run(id, name, normalized, now, now)

    return this.getByIdOrThrow(id)
  }

  getById(id: string): Tag | null {
    const row = this.db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow | undefined
    return row ? mapTag(row) : null
  }

  getByIdOrThrow(id: string): Tag {
    const tag = this.getById(id)
    if (!tag) {
      throw new AppErrorException('TAG_NOT_FOUND', 'Tag not found', { id })
    }
    return tag
  }

  list(includeDeleted = false): Tag[] {
    const sql = includeDeleted
      ? 'SELECT * FROM tags ORDER BY name COLLATE NOCASE'
      : 'SELECT * FROM tags WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE'
    const rows = this.db.prepare(sql).all() as TagRow[]
    return rows.map(mapTag)
  }

  update(id: string, input: UpdateTagInput): Tag {
    const existing = this.getByIdOrThrow(id)
    if (existing.deletedAt) {
      throw new AppErrorException('TAG_NOT_FOUND', 'Cannot update a deleted tag', { id })
    }

    if (input.name === undefined) {
      return existing
    }

    const name = input.name.trim()
    const normalized = normalizeName(name)
    const conflict = this.findByNormalized(normalized)
    if (conflict && conflict.id !== id && !conflict.deletedAt) {
      throw new AppErrorException('VALIDATION_ERROR', 'A tag with this name already exists', {
        name
      })
    }

    const now = nowIso()
    this.db
      .prepare(`UPDATE tags SET name = ?, normalized_name = ?, updated_at = ? WHERE id = ?`)
      .run(name, normalized, now, id)

    return this.getByIdOrThrow(id)
  }

  softDelete(id: string): void {
    const existing = this.getByIdOrThrow(id)
    if (existing.deletedAt) return

    const now = nowIso()
    this.db.prepare(`UPDATE tags SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(now, now, id)
  }

  private findByNormalized(normalized: string): Tag | null {
    const row = this.db
      .prepare('SELECT * FROM tags WHERE normalized_name = ?')
      .get(normalized) as TagRow | undefined
    return row ? mapTag(row) : null
  }
}
