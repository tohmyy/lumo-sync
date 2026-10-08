import type {
  ConflictResolution,
  Device,
  RemoteDeviceInfo,
  SyncConflictRecord,
  SyncStatusSnapshot
} from '../../shared/types'
import type { SyncEngine } from '../sync/sync-engine'
import type { SyncScheduler } from '../sync/sync-scheduler'
import type { SyncRemoteClient } from '../../shared/types'
import type { Repositories } from '../database/repositories'

export class SyncService {
  constructor(
    private readonly engine: SyncEngine,
    private readonly scheduler: SyncScheduler,
    private readonly remote: SyncRemoteClient,
    private readonly repos: Repositories
  ) {}

  getStatus(): SyncStatusSnapshot {
    return this.engine.getSnapshot()
  }

  syncNow(): Promise<SyncStatusSnapshot> {
    return this.engine.sync()
  }

  listConflicts(): SyncConflictRecord[] {
    return this.engine.listConflicts()
  }

  resolveConflict(conflictId: string, resolution: ConflictResolution): SyncConflictRecord {
    return this.engine.resolveConflict(conflictId, resolution)
  }

  scheduleAfterMutation(): void {
    this.scheduler.scheduleAfterMutation()
  }

  async listDevices(): Promise<{
    current: Device
    local: Device[]
    remote: RemoteDeviceInfo[]
  }> {
    const current = this.repos.devices.getCurrent()
    if (!current) {
      throw new Error('Current device is not initialized')
    }
    const pull = await this.remote.pull()
    return {
      current,
      local: this.repos.devices.list(),
      remote: pull.devices ?? []
    }
  }
}
