import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { EventBus } from '../src/main/ipc/event-bus'
import { FileRemoteClient } from '../src/main/sync/file-remote-client'
import { SyncEngine } from '../src/main/sync/sync-engine'
import { createTestDb, seedCurrentDevice } from './helpers/test-db'

function createEngine(ctx: ReturnType<typeof createTestDb>, storePath: string): SyncEngine {
  const remote = new FileRemoteClient(storePath)
  const events = new EventBus()
  return new SyncEngine(ctx.db, ctx.repos, remote, events)
}

describe('sync foundation', () => {
  it('pushes local mutations and pulls them onto a second device', async () => {
    const deviceA = createTestDb()
    const deviceB = createTestDb()
    try {
      seedCurrentDevice(deviceA.repos)
      deviceB.repos.devices.createCurrent({
        name: 'Device B',
        platform: 'macos',
        appVersion: '0.1.0'
      })

      const storePath = join(deviceA.dir, 'sync-store.json')
      const engineA = createEngine(deviceA, storePath)
      const engineB = createEngine(deviceB, storePath)

      const asset = deviceA.repos.assets.create(
        {
          type: 'snippet',
          title: 'Shared hook',
          content: 'export const useX = () => 1',
          language: 'typescript',
          tags: ['hooks']
        },
        deviceA.repos.devices.getCurrent()!.id
      )

      const snapA = await engineA.sync()
      expect(snapA.status).toBe('synced')
      expect(snapA.pendingCount).toBe(0)

      const snapB = await engineB.sync()
      expect(snapB.status).toBe('synced')

      const pulled = deviceB.repos.assets.getById(asset.id)
      expect(pulled).not.toBeNull()
      expect(pulled!.title).toBe('Shared hook')
      expect(pulled!.content).toContain('useX')
      expect(pulled!.tags).toContain('hooks')
    } finally {
      deviceA.dispose()
      deviceB.dispose()
    }
  })

  it('does not duplicate operations on idempotent push', async () => {
    const ctx = createTestDb()
    try {
      seedCurrentDevice(ctx.repos)
      const storePath = join(ctx.dir, 'sync-store.json')
      const remote = new FileRemoteClient(storePath)
      const engine = createEngine(ctx, storePath)

      ctx.repos.assets.create(
        { type: 'note', title: 'Once', content: 'body' },
        ctx.repos.devices.getCurrent()!.id
      )

      await engine.sync()
      await engine.sync()

      const pull = await remote.pull()
      expect(pull.operations).toHaveLength(1)
    } finally {
      ctx.dispose()
    }
  })

  it('recovers pending operations after a failed push', async () => {
    const ctx = createTestDb()
    try {
      seedCurrentDevice(ctx.repos)
      const storePath = join(ctx.dir, 'sync-store.json')
      const events = new EventBus()

      let failNext = true
      const flaky = {
        async registerDevice(): Promise<void> {},
        async push(): Promise<{ acknowledgedIds: string[] }> {
          if (failNext) {
            failNext = false
            throw new Error('network down')
          }
          return { acknowledgedIds: [] }
        },
        async pull(): Promise<{ operations: never[]; cursor: string }> {
          return { operations: [], cursor: '0' }
        }
      }

      // First engine uses flaky remote that fails push
      const engineFail = new SyncEngine(ctx.db, ctx.repos, flaky, events)
      ctx.repos.assets.create(
        { type: 'note', title: 'Retry me', content: 'hello' },
        ctx.repos.devices.getCurrent()!.id
      )

      const failed = await engineFail.sync()
      expect(failed.status).toBe('error')

      const pending = ctx.db
        .prepare(
          `SELECT COUNT(*) AS c FROM sync_operations WHERE status IN ('pending', 'failed')`
        )
        .get() as { c: number }
      expect(pending.c).toBeGreaterThan(0)

      const engineOk = new SyncEngine(
        ctx.db,
        ctx.repos,
        new FileRemoteClient(storePath),
        events
      )
      const recovered = await engineOk.sync()
      expect(recovered.status).toBe('synced')
      expect(recovered.pendingCount).toBe(0)
    } finally {
      ctx.dispose()
    }
  })

  it('survives restart by keeping sync cursor and completed ops', async () => {
    const ctx = createTestDb()
    try {
      seedCurrentDevice(ctx.repos)
      const storePath = join(ctx.dir, 'sync-store.json')
      const engine = createEngine(ctx, storePath)

      ctx.repos.assets.create(
        { type: 'snippet', title: 'Persist sync', content: 'x' },
        ctx.repos.devices.getCurrent()!.id
      )
      await engine.sync()

      const cursor = ctx.db
        .prepare(`SELECT value FROM sync_state WHERE key = 'last_pull_cursor'`)
        .get() as { value: string }
      expect(cursor.value).toBeTruthy()

      const engine2 = createEngine(ctx, storePath)
      const snap = await engine2.sync()
      expect(snap.status).toBe('synced')
      expect(snap.cursor).toBe(cursor.value)
    } finally {
      ctx.dispose()
    }
  })
})
