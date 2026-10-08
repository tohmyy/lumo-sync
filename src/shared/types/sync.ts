export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'pending'
  | 'offline'
  | 'error'
  | 'conflict'

export type SyncEntityType = 'asset'

export type SyncOpKind = 'create' | 'update' | 'delete' | 'restore'

export interface SyncOperationRecord {
  id: string
  entityType: SyncEntityType
  entityId: string
  operation: SyncOpKind
  baseVersion: number | null
  targetVersion: number | null
  payload: string
  createdAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'blocked'
  attemptCount: number
  lastAttemptAt: string | null
  lastError: string | null
}

export interface RemoteSyncOperation {
  id: string
  deviceId: string
  entityType: SyncEntityType
  entityId: string
  operation: SyncOpKind
  baseVersion: number | null
  targetVersion: number | null
  payload: string
  createdAt: string
}

export interface PushResult {
  acknowledgedIds: string[]
}

export interface PullResult {
  operations: RemoteSyncOperation[]
  cursor: string
  devices?: RemoteDeviceInfo[]
}

export interface RemoteDeviceInfo {
  id: string
  name: string
  platform: string
  appVersion: string | null
  lastSeenAt: string
}

export interface SyncRemoteClient {
  registerDevice(device: RemoteDeviceInfo): Promise<void>
  push(operations: RemoteSyncOperation[]): Promise<PushResult>
  pull(cursor?: string): Promise<PullResult>
}

export interface SyncStatusSnapshot {
  status: SyncStatus
  lastSuccessfulSyncAt: string | null
  lastAttemptAt: string | null
  lastError: string | null
  pendingCount: number
  conflictCount: number
  cursor: string | null
}

export interface SyncConflictRecord {
  id: string
  entityType: SyncEntityType
  entityId: string
  localVersion: number | null
  remoteVersion: number | null
  localPayload: string
  remotePayload: string
  detectedAt: string
  resolution: string | null
  resolvedAt: string | null
  resolvedByDeviceId: string | null
}

export type ConflictResolution = 'keep_local' | 'keep_remote'
