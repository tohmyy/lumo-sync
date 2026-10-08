export interface Collection {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdByDeviceId: string | null
  updatedByDeviceId: string | null
}

export interface CollectionWithCount extends Collection {
  assetCount: number
}

export interface CreateCollectionInput {
  name: string
  description?: string
}

export interface UpdateCollectionInput {
  name?: string
  description?: string | null
}
