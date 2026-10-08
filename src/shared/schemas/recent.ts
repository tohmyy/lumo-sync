import { z } from 'zod'
import { entityIdSchema } from './common'

export const trackRecentSchema = z.object({
  assetId: entityIdSchema
})

export const recentListSchema = z
  .object({
    limit: z.number().int().positive().max(100).optional()
  })
  .optional()
  .default({})
