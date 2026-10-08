import { z } from 'zod'
import { entityIdSchema } from './common'

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().optional()
})

export const updateCollectionSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional()
})

export const collectionIdSchema = z.object({
  id: entityIdSchema
})

export const updateCollectionRequestSchema = z.object({
  id: entityIdSchema,
  input: updateCollectionSchema
})

export const collectionAssetSchema = z.object({
  collectionId: entityIdSchema,
  assetId: entityIdSchema
})
