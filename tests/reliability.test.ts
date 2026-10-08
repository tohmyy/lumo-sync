import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { runMigrations } from '../src/main/database/migrations/runner'
import { EventBus } from '../src/main/ipc/event-bus'
import { applyRemoteOperations } from '../src/main/sync/apply-remote'
import { ConflictStore } from '../src/main/sync/conflict-store'
import { FileRemoteClient } from '../src/main/sync/file-remote-client'
import { SyncEngine } from '../src/main/sync/sync-engine'
import { createTestDb, seedCurrentDevice } from './helpers/test-db'

describe('reliability', () => {
  it('queues offline mutations and syncs them after reconnect', async () => {
    const deviceA = createTestDb()
    const deviceB = createTestDb()
    try {
      seedCurrentDevice(deviceA.repos)
      deviceB.repos.devices.createCurrent({
        name: 'Device B',
        platform: 'linux',
        appVersion: '0.1.0'
      })

      const storePath = join(deviceA.dir, 'offline-store.json')
      const engineA = new SyncEngine(
        deviceA.db,
        deviceA.repos,
        new FileRemoteClient(storePath),
        new EventBus()
      )
      const engineB = new SyncEngine(
        deviceB.db,
        deviceB.repos,
        new FileRemoteClient(storePath),
        new EventBus()
      )

      // Establish empty remote + register devices
      await engineA.sync()
      await engineB.sync()

      // Offline local mutations on A
      const created = deviceA.repos.assets.create(
        {
          type: 'snippet',
          title: 'Offline note',
          content: 'written while disconnected'
        },
        deviceA.repos.devices.getCurrent()!.id
      )
      deviceA.repos.assets.update(
        created.id,
        { content: 'updated offline' },
        deviceA.repos.devices.getCurrent()!.id
      )

      const pending = deviceA.db
        .prepare(
          `SELECT COUNT(*) AS c FROM sync_operations WHERE status IN ('pending', 'failed')`
        )
        .get() as { c: number }
      expect(pending.c).toBeGreaterThanOrEqual(2)

      // Reconnect
      await engineA.sync()
      await engineB.sync()

      const pulled = deviceB.repos.assets.getById(created.id)
      expect(pulled?.content).toBe('updated offline')
    } finally {
      deviceA.dispose()
      deviceB.dispose()
    }
  })

  it('ignores corrupt remote payloads without crashing sync', async () => {
    const ctx = createTestDb()
    try {
      const deviceId = seedCurrentDevice(ctx.repos)
      const conflicts = new ConflictStore(ctx.db)

      const result = applyRemoteOperations(
        ctx.db,
        conflicts,
        [
          {
            id: 'op-bad',
            deviceId: 'other-device',
            entityType: 'asset',
            entityId: 'missing',
            operation: 'update',
            baseVersion: 1,
            targetVersion: 2,
            payload: '{not-json',
            createdAt: new Date().toISOString()
          }
        ],
        deviceId
      )

      expect(result.applied).toBe(0)
      expect(ctx.repos.assets.list()).toHaveLength(0)
    } finally {
      ctx.dispose()
    }
  })

  it('handles a large local collection without losing rows across sync', async () => {
    const deviceA = createTestDb()
    const deviceB = createTestDb()
    try {
      seedCurrentDevice(deviceA.repos)
      deviceB.repos.devices.createCurrent({
        name: 'Device B',
        platform: 'windows',
        appVersion: '0.1.0'
      })

      const storePath = join(deviceA.dir, 'bulk-store.json')
      const engineA = new SyncEngine(
        deviceA.db,
        deviceA.repos,
        new FileRemoteClient(storePath),
        new EventBus()
      )
      const engineB = new SyncEngine(
        deviceB.db,
        deviceB.repos,
        new FileRemoteClient(storePath),
        new EventBus()
      )

      const deviceId = deviceA.repos.devices.getCurrent()!.id
      for (let i = 0; i < 120; i += 1) {
        deviceA.repos.assets.create(
          {
            type: i % 2 === 0 ? 'snippet' : 'note',
            title: `Asset ${i}`,
            content: `body-${i}`
          },
          deviceId
        )
      }

      // Push in batches via repeated sync (engine batches 100)
      await engineA.sync()
      await engineA.sync()
      await engineB.sync()
      await engineB.sync()

      expect(deviceB.repos.assets.list()).toHaveLength(120)
    } finally {
      deviceA.dispose()
      deviceB.dispose()
    }
  })

  it('keeps migrations idempotent on reopen', () => {
    const ctx = createTestDb()
    try {
      const version1 = ctx.db
        .prepare(`SELECT value FROM app_metadata WHERE key = 'schema_version'`)
        .get() as { value: string }
      expect(version1.value).toBe('1')

      runMigrations(ctx.db)

      const version2 = ctx.db
        .prepare(`SELECT value FROM app_metadata WHERE key = 'schema_version'`)
        .get() as { value: string }
      expect(version2.value).toBe('1')
    } finally {
      ctx.dispose()
    }
  })
})
