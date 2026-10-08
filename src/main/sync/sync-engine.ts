import type { SqliteDatabase } from '../database/connection'
import type { Repositories } from '../database/repositories'
import type {
  ConflictResolution,
  RemoteSyncOperation,
  SyncConflictRecord,
  SyncRemoteClient,
  SyncStatusSnapshot
} from '../../shared/types'
import { AppEvents } from '../../shared/constants'
import { nowIso } from '../../shared/utils'
import type { EventBus } from '../ipc/event-bus'
import { createLogger } from '../logging/logger'
import { enqueueAssetSyncOperation } from '../database/sync-operations'
import { applyRemoteOperations } from './apply-remote'
import { ConflictStore } from './conflict-store'
import { SyncStateStore } from './sync-state-store'

const log = createLogger('sync-engine')

export class SyncEngine {
  private running = false
  private readonly state: SyncStateStore
  private readonly conflicts: ConflictStore

  constructor(
    private readonly db: SqliteDatabase,
    private readonly repos: Repositories,
    private readonly remote: SyncRemoteClient,
    private readonly events: EventBus
  ) {
    this.state = new SyncStateStore(db)
    this.conflicts = new ConflictStore(db)
  }

  getSnapshot(): SyncStatusSnapshot {
    const pending = this.db
      .prepare(
        `SELECT COUNT(*) AS c FROM sync_operations WHERE status IN ('pending', 'failed')`
      )
      .get() as { c: number }

    return {
      status: this.state.getStatus(),
      lastSuccessfulSyncAt: this.state.get('last_successful_sync_at'),
      lastAttemptAt: this.state.get('last_sync_attempt_at'),
      lastError: this.state.get('last_sync_error') || null,
      pendingCount: pending.c,
      conflictCount: this.conflicts.countUnresolved(),
      cursor: this.state.getCursor()
    }
  }

  listConflicts(): SyncConflictRecord[] {
    return this.conflicts.listUnresolved()
  }

  markPendingIfIdle(): void {
    const status = this.state.getStatus()
    if (status === 'idle' || status === 'synced') {
      this.state.setStatus('pending')
      this.emitStatus()
    }
  }

  async sync(): Promise<SyncStatusSnapshot> {
    if (this.running) {
      return this.getSnapshot()
    }
    this.running = true
    this.state.setStatus('syncing')
    this.emitStatus()

    try {
      const device = this.repos.devices.getCurrent()
      if (!device) {
        throw new Error('Current device is not initialized')
      }

      await this.remote.registerDevice({
        id: device.id,
        name: device.name,
        platform: device.platform,
        appVersion: device.appVersion,
        lastSeenAt: nowIso()
      })

      await this.pushPending(device.id)
      await this.pullRemote(device.id)

      this.state.markSuccess()
      if (this.conflicts.countUnresolved() > 0) {
        this.state.setStatus('conflict')
      }
      this.emitStatus()
      return this.getSnapshot()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed'
      log.error({ err: error }, 'Sync failed')
      this.state.markAttempt(message)
      this.state.setStatus('error')
      this.emitStatus()
      return this.getSnapshot()
    } finally {
      this.running = false
    }
  }

  resolveConflict(
    conflictId: string,
    resolution: ConflictResolution
  ): SyncConflictRecord {
    const device = this.repos.devices.getCurrent()
    if (!device) {
      throw new Error('Current device is not initialized')
    }
    const conflict = this.conflicts.getById(conflictId)
    if (!conflict || conflict.resolution) {
      throw new Error('Conflict not found')
    }

    const payload =
      resolution === 'keep_local' ? conflict.localPayload : conflict.remotePayload
    const parsed = JSON.parse(payload) as {
      id: string
      type: string
      title: string
      description: string | null
      language: string | null
      content: string
      isFavorite: boolean
      version: number
      deletedAt: string | null
      tags?: string[]
    }

    const nextVersion =
      Math.max(conflict.localVersion ?? 0, conflict.remoteVersion ?? 0, parsed.version) + 1
    const now = nowIso()

    this.db
      .prepare(
        `UPDATE assets SET
          type = ?, title = ?, description = ?, language = ?, content = ?,
          is_favorite = ?, version = ?, updated_at = ?, deleted_at = ?, updated_by_device_id = ?
         WHERE id = ?`
      )
      .run(
        parsed.type,
        parsed.title,
        parsed.description,
        parsed.language,
        parsed.content,
        parsed.isFavorite ? 1 : 0,
        nextVersion,
        now,
        parsed.deletedAt,
        device.id,
        parsed.id
      )

    this.db.prepare('DELETE FROM asset_search WHERE asset_id = ?').run(parsed.id)
    if (!parsed.deletedAt) {
      this.db
        .prepare(
          `INSERT INTO asset_search (asset_id, title, description, content, language)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          parsed.id,
          parsed.title,
          parsed.description ?? '',
          parsed.content,
          parsed.language ?? ''
        )
    }

    const asset = this.repos.assets.getByIdOrThrow(parsed.id)
    enqueueAssetSyncOperation(this.db, {
      asset,
      operation: 'update',
      baseVersion: conflict.localVersion
    })

    const resolved = this.conflicts.resolve(conflictId, resolution, device.id)
    this.events.emit(AppEvents.assetUpdated, { id: parsed.id })
    this.events.emit(AppEvents.syncConflict, { id: conflictId, resolution })
    if (this.conflicts.countUnresolved() === 0 && this.state.getStatus() === 'conflict') {
      this.state.setStatus('pending')
    }
    this.emitStatus()
    return resolved
  }

  private async pushPending(deviceId: string): Promise<void> {
    const rows = this.db
      .prepare(
        `SELECT * FROM sync_operations
         WHERE status IN ('pending', 'failed')
         ORDER BY created_at ASC
         LIMIT 100`
      )
      .all() as Array<{
      id: string
      entity_type: string
      entity_id: string
      operation: string
      base_version: number | null
      target_version: number | null
      payload: string
      created_at: string
      attempt_count: number
    }>

    if (rows.length === 0) return

    const ids = rows.map((r) => r.id)
    this.db
      .prepare(
        `UPDATE sync_operations SET status = 'processing', last_attempt_at = ?
         WHERE id IN (${ids.map(() => '?').join(',')})`
      )
      .run(nowIso(), ...ids)

    const remoteOps: RemoteSyncOperation[] = rows.map((r) => ({
      id: r.id,
      deviceId,
      entityType: 'asset',
      entityId: r.entity_id,
      operation: r.operation as RemoteSyncOperation['operation'],
      baseVersion: r.base_version,
      targetVersion: r.target_version,
      payload: r.payload,
      createdAt: r.created_at
    }))

    try {
      const result = await this.remote.push(remoteOps)
      const acked = new Set(result.acknowledgedIds)
      for (const row of rows) {
        if (acked.has(row.id)) {
          this.db
            .prepare(`UPDATE sync_operations SET status = 'completed', last_error = NULL WHERE id = ?`)
            .run(row.id)
        } else {
          this.db
            .prepare(
              `UPDATE sync_operations
               SET status = 'failed', attempt_count = attempt_count + 1, last_error = ?
               WHERE id = ?`
            )
            .run('Not acknowledged', row.id)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Push failed'
      for (const row of rows) {
        this.db
          .prepare(
            `UPDATE sync_operations
             SET status = 'failed', attempt_count = attempt_count + 1,
                 last_attempt_at = ?, last_error = ?
             WHERE id = ?`
          )
          .run(nowIso(), message, row.id)
      }
      throw error
    }
  }

  private async pullRemote(deviceId: string): Promise<void> {
    const cursor = this.state.getCursor() ?? undefined
    const result = await this.remote.pull(cursor)

    if (result.devices) {
      for (const remoteDevice of result.devices) {
        const platform = normalizePlatform(remoteDevice.platform)
        this.repos.devices.upsertRemote({
          id: remoteDevice.id,
          name: remoteDevice.name,
          platform,
          appVersion: remoteDevice.appVersion ?? undefined,
          lastSeenAt: remoteDevice.lastSeenAt
        })
      }
      this.events.emit(AppEvents.deviceUpdated, { count: result.devices.length })
    }

    const { conflictsCreated } = applyRemoteOperations(
      this.db,
      this.conflicts,
      result.operations,
      deviceId
    )
    this.state.setCursor(result.cursor)
    if (conflictsCreated > 0) {
      this.state.setStatus('conflict')
      this.events.emit(AppEvents.syncConflict, { count: conflictsCreated })
    }
    for (const op of result.operations) {
      if (op.deviceId !== deviceId && op.entityType === 'asset') {
        this.events.emit(AppEvents.assetUpdated, { id: op.entityId })
      }
    }
  }

  private emitStatus(): void {
    this.events.emit(AppEvents.syncStatusChanged, this.getSnapshot())
  }
}

function normalizePlatform(value: string): 'windows' | 'macos' | 'linux' {
  if (value === 'windows' || value === 'macos' || value === 'linux') {
    return value
  }
  if (value === 'win32') return 'windows'
  if (value === 'darwin') return 'macos'
  return 'linux'
}
