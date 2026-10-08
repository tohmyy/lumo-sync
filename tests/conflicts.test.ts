import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { EventBus } from '../src/main/ipc/event-bus'
import { FileRemoteClient } from '../src/main/sync/file-remote-client'
import { SyncEngine } from '../src/main/sync/sync-engine'
import { createTestDb, seedCurrentDevice } from './helpers/test-db'

describe('conflict resolution', () => {
  it('detects concurrent edits and keeps the chosen side', async () => {
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

      const created = deviceA.repos.assets.create(
        {
          type: 'snippet',
          title: 'Docker Cleanup',
          content: 'docker prune'
        },
        deviceA.repos.devices.getCurrent()!.id
      )

      await engineA.sync()
      await engineB.sync()

      // Concurrent diverging edits from a shared base version
      deviceA.repos.assets.update(
        created.id,
        { content: 'docker prune --all' },
        deviceA.repos.devices.getCurrent()!.id
      )
      deviceB.repos.assets.update(
        created.id,
        { content: 'docker system prune' },
        deviceB.repos.devices.getCurrent()!.id
      )

      await engineA.sync()
      const afterPull = await engineB.sync()
      expect(afterPull.conflictCount).toBeGreaterThan(0)

      const conflicts = engineB.listConflicts()
      expect(conflicts).toHaveLength(1)

      const resolved = engineB.resolveConflict(conflicts[0]!.id, 'keep_remote')
      expect(resolved.resolution).toBe('keep_remote')

      const asset = deviceB.repos.assets.getById(created.id)!
      // keep_remote uses the remote payload that B received from A
      expect(asset.content).toBe('docker prune --all')
      expect(engineB.listConflicts()).toHaveLength(0)
    } finally {
      deviceA.dispose()
      deviceB.dispose()
    }
  })

  it('preserves both payloads until the user resolves', async () => {
    const deviceA = createTestDb()
    const deviceB = createTestDb()
    try {
      seedCurrentDevice(deviceA.repos)
      deviceB.repos.devices.createCurrent({
        name: 'Device B',
        platform: 'linux',
        appVersion: '0.1.0'
      })

      const storePath = join(deviceA.dir, 'conflict-store.json')
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

      const created = deviceA.repos.assets.create(
        { type: 'note', title: 'Draft', content: 'v1' },
        deviceA.repos.devices.getCurrent()!.id
      )
      await engineA.sync()
      await engineB.sync()

      deviceA.repos.assets.update(
        created.id,
        { content: 'local-only' },
        deviceA.repos.devices.getCurrent()!.id
      )
      deviceB.repos.assets.update(
        created.id,
        { content: 'remote-only' },
        deviceB.repos.devices.getCurrent()!.id
      )

      await engineA.sync()
      await engineB.sync()

      const conflict = engineB.listConflicts()[0]!
      const local = JSON.parse(conflict.localPayload) as { content: string }
      const remote = JSON.parse(conflict.remotePayload) as { content: string }
      expect(local.content).toBe('remote-only')
      expect(remote.content).toBe('local-only')

      engineB.resolveConflict(conflict.id, 'keep_local')
      expect(deviceB.repos.assets.getById(created.id)!.content).toBe('remote-only')
    } finally {
      deviceA.dispose()
      deviceB.dispose()
    }
  })
})
