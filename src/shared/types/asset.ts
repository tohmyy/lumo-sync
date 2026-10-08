export type AssetType = 'snippet' | 'command' | 'config' | 'note' | 'template'

export interface Asset {
  id: string
  type: AssetType
  title: string
  description: string | null
  language: string | null
  content: string
  isFavorite: boolean
  version: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdByDeviceId: string | null
  updatedByDeviceId: string | null
}

export interface CreateAssetInput {
  type: AssetType
  title: string
  description?: string
  language?: string
  content: string
  isFavorite?: boolean
  tags?: string[]
}

export interface UpdateAssetInput {
  type?: AssetType
  title?: string
  description?: string | null
  language?: string | null
  content?: string
  isFavorite?: boolean
  tags?: string[]
}

export interface AssetListQuery {
  type?: AssetType
  isFavorite?: boolean
  includeDeleted?: boolean
  limit?: number
  offset?: number
  search?: string
}
