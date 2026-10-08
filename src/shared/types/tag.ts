export interface Tag {
  id: string
  name: string
  normalizedName: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateTagInput {
  name: string
}

export interface UpdateTagInput {
  name?: string
}
