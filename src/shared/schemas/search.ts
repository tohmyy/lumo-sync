import { z } from 'zod'
import { assetTypeSchema } from './asset'

export const searchQuerySchema = z.object({
  query: z.string().trim().min(1),
  type: assetTypeSchema.optional(),
  isFavorite: z.boolean().optional(),
  limit: z.number().int().positive().max(200).optional()
})
