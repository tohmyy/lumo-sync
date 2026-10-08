import { z } from 'zod'
import { entityIdSchema } from './common'

export const assetTypeSchema = z.enum(['snippet', 'command', 'config', 'note', 'template'])

export const createAssetSchema = z.object({
  type: assetTypeSchema,
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().optional(),
  language: z.string().optional(),
  content: z.string(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional()
})

export const updateAssetSchema = z.object({
  type: assetTypeSchema.optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  content: z.string().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional()
})

export const assetSortBySchema = z.enum(['updated', 'created', 'title', 'opened'])

export const assetListQuerySchema = z.object({
  type: assetTypeSchema.optional(),
  isFavorite: z.boolean().optional(),
  includeDeleted: z.boolean().optional(),
  limit: z.number().int().positive().max(500).optional(),
  offset: z.number().int().nonnegative().optional(),
  search: z.string().optional(),
  sortBy: assetSortBySchema.optional(),
  tag: z.string().optional(),
  collectionId: entityIdSchema.optional()
})

export const assetIdSchema = z.object({
  id: entityIdSchema
})

export const updateAssetRequestSchema = z.object({
  id: entityIdSchema,
  input: updateAssetSchema
})
