import { rmSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { openDatabase, closeDatabase, withTransaction } from '../src/main/database/connection'
import { createTestDb, seedCurrentDevice } from './helpers/test-db'

describe('database foundation', () => {
  it('runs migrations and creates core tables', () => {
    const ctx = createTestDb()
    try {
      const tables = ctx.db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
        .all() as Array<{ name: string }>

      const names = tables.map((t) => t.name)
      expect(names).toContain('assets')
      expect(names).toContain('devices')
      expect(names).toContain('collections')
      expect(names).toContain('tags')
      expect(names).toContain('settings')
      expect(names).toContain('sync_operations')

      const version = ctx.db
        .prepare(`SELECT value FROM app_metadata WHERE key = 'schema_version'`)
        .get() as { value: string }
      expect(version.value).toBe('1')
    } finally {
      ctx.dispose()
    }
  })

  it('enforces foreign keys', () => {
    const ctx = createTestDb()
    try {
      expect(() => {
        ctx.db
          .prepare(
            `INSERT INTO assets (
              id, type, title, content, is_favorite, version, created_at, updated_at,
              created_by_device_id, updated_by_device_id
            ) VALUES ('a1', 'snippet', 'x', 'y', 0, 1, 't', 't', 'missing-device', 'missing-device')`
          )
          .run()
      }).toThrow()
    } finally {
      ctx.dispose()
    }
  })

  it('supports transactions with rollback', () => {
    const ctx = createTestDb()
    try {
      const deviceId = seedCurrentDevice(ctx.repos)

      expect(() => {
        withTransaction(ctx.db, () => {
          ctx.repos.assets.create(
            {
              type: 'note',
              title: 'Will rollback',
              content: 'nope'
            },
            deviceId
          )
          throw new Error('force rollback')
        })
      }).toThrow('force rollback')

      expect(ctx.repos.assets.list()).toHaveLength(0)
    } finally {
      ctx.dispose()
    }
  })

  it('persists data across reopen', () => {
    const ctx = createTestDb()
    try {
      const deviceId = seedCurrentDevice(ctx.repos)
      const created = ctx.repos.assets.create(
        {
          type: 'snippet',
          title: 'Persist me',
          content: 'const x = 1',
          language: 'typescript'
        },
        deviceId
      )
      closeDatabase(ctx.db)

      const reopened = openDatabase({ path: ctx.path })
      try {
        const row = reopened
          .prepare('SELECT title FROM assets WHERE id = ?')
          .get(created.id) as { title: string }
        expect(row.title).toBe('Persist me')
      } finally {
        closeDatabase(reopened)
      }
    } finally {
      rmSync(ctx.dir, { recursive: true, force: true })
    }
  })
})

describe('repositories', () => {
  it('creates current device once', () => {
    const ctx = createTestDb()
    try {
      const first = ctx.repos.devices.createCurrent({
        name: 'Device A',
        platform: 'windows'
      })
      const second = ctx.repos.devices.createCurrent({
        name: 'Device B',
        platform: 'linux'
      })
      expect(second.id).toBe(first.id)
      expect(ctx.repos.devices.getCurrent()?.isCurrent).toBe(true)
    } finally {
      ctx.dispose()
    }
  })

  it('supports asset CRUD, soft delete, and restore', () => {
    const ctx = createTestDb()
    try {
      const deviceId = seedCurrentDevice(ctx.repos)
      const asset = ctx.repos.assets.create(
        {
          type: 'command',
          title: 'Docker prune',
          content: 'docker system prune -af',
          language: 'bash',
          tags: ['docker']
        },
        deviceId
      )

      expect(asset.version).toBe(1)
      expect(ctx.repos.tags.list().map((t) => t.normalizedName)).toContain('docker')

      const updated = ctx.repos.assets.update(
        asset.id,
        { title: 'Docker cleanup', isFavorite: true },
        deviceId
      )
      expect(updated.version).toBe(2)
      expect(updated.isFavorite).toBe(true)

      ctx.repos.assets.softDelete(asset.id, deviceId)
      expect(ctx.repos.assets.list()).toHaveLength(0)
      expect(ctx.repos.assets.getById(asset.id)?.deletedAt).not.toBeNull()

      const restored = ctx.repos.assets.restore(asset.id, deviceId)
      expect(restored.deletedAt).toBeNull()
      expect(restored.version).toBe(4)
      expect(ctx.repos.assets.list()).toHaveLength(1)
    } finally {
      ctx.dispose()
    }
  })

  it('manages collections, recent, and settings', () => {
    const ctx = createTestDb()
    try {
      const deviceId = seedCurrentDevice(ctx.repos)
      const asset = ctx.repos.assets.create(
        { type: 'note', title: 'A', content: 'body' },
        deviceId
      )

      const collection = ctx.repos.collections.create(
        { name: 'Frontend', description: 'UI bits' },
        deviceId
      )
      ctx.repos.collections.addAsset(collection.id, asset.id)
      expect(ctx.repos.collections.listAssetIds(collection.id)).toEqual([asset.id])

      const recent = ctx.repos.recent.track(asset.id)
      expect(recent.openCount).toBe(1)
      expect(ctx.repos.recent.track(asset.id).openCount).toBe(2)

      ctx.repos.settings.set('theme', 'dark')
      expect(ctx.repos.settings.get('theme')).toBe('dark')
      expect(ctx.repos.settings.getAll().theme).toBe('dark')
    } finally {
      ctx.dispose()
    }
  })

  it('searches assets via FTS', () => {
    const ctx = createTestDb()
    try {
      const deviceId = seedCurrentDevice(ctx.repos)
      ctx.repos.assets.create(
        {
          type: 'snippet',
          title: 'Fetch API Example',
          content: 'await fetch("/api/users")',
          language: 'typescript'
        },
        deviceId
      )
      ctx.repos.assets.create(
        {
          type: 'command',
          title: 'List files',
          content: 'ls -la',
          language: 'bash'
        },
        deviceId
      )

      const results = ctx.repos.assets.search('fetch')
      expect(results).toHaveLength(1)
      expect(results[0]?.title).toBe('Fetch API Example')

      const listed = ctx.repos.assets.list({ search: 'fetch' })
      expect(listed).toHaveLength(1)
      expect(listed[0]?.title).toBe('Fetch API Example')
    } finally {
      ctx.dispose()
    }
  })

  it('hydrates tags and enqueues sync operations', () => {
    const ctx = createTestDb()
    try {
      const deviceId = seedCurrentDevice(ctx.repos)
      const asset = ctx.repos.assets.create(
        {
          type: 'snippet',
          title: 'Tagged snippet',
          content: ' const x = 1',
          language: 'typescript',
          tags: ['React', 'api']
        },
        deviceId
      )

      expect(asset.tags.map((t) => t.toLowerCase()).sort()).toEqual(['api', 'react'])
      expect(ctx.repos.assets.getById(asset.id)?.tags).toEqual(asset.tags)
      expect(ctx.repos.assets.list()[0]?.tags).toEqual(asset.tags)

      const createOps = ctx.db
        .prepare(
          `SELECT operation, status, entity_id FROM sync_operations WHERE entity_id = ? ORDER BY created_at`
        )
        .all(asset.id) as Array<{ operation: string; status: string; entity_id: string }>
      expect(createOps).toHaveLength(1)
      expect(createOps[0]).toMatchObject({
        operation: 'create',
        status: 'pending',
        entity_id: asset.id
      })

      ctx.repos.assets.update(asset.id, { title: 'Tagged snippet v2' }, deviceId)
      ctx.repos.assets.softDelete(asset.id, deviceId)

      const ops = ctx.db
        .prepare(`SELECT operation FROM sync_operations WHERE entity_id = ? ORDER BY created_at`)
        .all(asset.id) as Array<{ operation: string }>
      expect(ops.map((o) => o.operation)).toEqual(['create', 'update', 'delete'])
    } finally {
      ctx.dispose()
    }
  })
})
