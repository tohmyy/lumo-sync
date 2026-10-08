import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { dirname } from 'path'
import type {
  PushResult,
  PullResult,
  RemoteDeviceInfo,
  RemoteSyncOperation,
  SyncRemoteClient
} from '../../shared/types'
import { createLogger } from '../logging/logger'

const log = createLogger('remote-client')

interface RemoteStore {
  devices: RemoteDeviceInfo[]
  operations: RemoteSyncOperation[]
}

function emptyStore(): RemoteStore {
  return { devices: [], operations: [] }
}

/**
 * File-backed remote sync store for local multi-device demos.
 * Point multiple app instances at the same path via LUMOSYNC_SYNC_STORE.
 */
export class FileRemoteClient implements SyncRemoteClient {
  constructor(private readonly storePath: string) {
    mkdirSync(dirname(storePath), { recursive: true })
  }

  private read(): RemoteStore {
    if (!existsSync(this.storePath)) {
      return emptyStore()
    }
    try {
      const raw = readFileSync(this.storePath, 'utf8')
      return JSON.parse(raw) as RemoteStore
    } catch (error) {
      log.warn({ err: error }, 'Failed to read sync store; starting empty')
      return emptyStore()
    }
  }

  private write(store: RemoteStore): void {
    writeFileSync(this.storePath, JSON.stringify(store, null, 2), 'utf8')
  }

  async registerDevice(device: RemoteDeviceInfo): Promise<void> {
    const store = this.read()
    const idx = store.devices.findIndex((d) => d.id === device.id)
    if (idx >= 0) {
      store.devices[idx] = device
    } else {
      store.devices.push(device)
    }
    this.write(store)
  }

  async push(operations: RemoteSyncOperation[]): Promise<PushResult> {
    const store = this.read()
    const existing = new Set(store.operations.map((o) => o.id))
    const acknowledgedIds: string[] = []

    for (const op of operations) {
      if (existing.has(op.id)) {
        acknowledgedIds.push(op.id)
        continue
      }
      store.operations.push(op)
      existing.add(op.id)
      acknowledgedIds.push(op.id)
    }

    this.write(store)
    return { acknowledgedIds }
  }

  async pull(cursor?: string): Promise<PullResult> {
    const store = this.read()
    const start = cursor ? Number.parseInt(cursor, 10) || 0 : 0
    const operations = store.operations.slice(start)
    return {
      operations,
      cursor: String(store.operations.length),
      devices: store.devices
    }
  }
}
