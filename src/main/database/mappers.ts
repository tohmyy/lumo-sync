import type { Asset, AssetType, Collection, Device, DevicePlatform, RecentAsset, Tag } from '../../shared/types'

export interface AssetRow {
  id: string
  type: string
  title: string
  description: string | null
  language: string | null
  content: string
  is_favorite: number
  version: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by_device_id: string | null
  updated_by_device_id: string | null
}

export interface CollectionRow {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by_device_id: string | null
  updated_by_device_id: string | null
}

export interface TagRow {
  id: string
  name: string
  normalized_name: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DeviceRow {
  id: string
  name: string
  platform: string
  app_version: string | null
  is_current: number
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface RecentRow {
  asset_id: string
  opened_at: string
  open_count: number
}

export function mapAsset(row: AssetRow, tags: string[] = []): Asset {
  return {
    id: row.id,
    type: row.type as AssetType,
    title: row.title,
    description: row.description,
    language: row.language,
    content: row.content,
    isFavorite: row.is_favorite === 1,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdByDeviceId: row.created_by_device_id,
    updatedByDeviceId: row.updated_by_device_id,
    tags
  }
}

export function mapCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdByDeviceId: row.created_by_device_id,
    updatedByDeviceId: row.updated_by_device_id
  }
}

export function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  }
}

export function mapDevice(row: DeviceRow): Device {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform as DevicePlatform,
    appVersion: row.app_version,
    isCurrent: row.is_current === 1,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function mapRecent(row: RecentRow): RecentAsset {
  return {
    assetId: row.asset_id,
    openedAt: row.opened_at,
    openCount: row.open_count
  }
}
