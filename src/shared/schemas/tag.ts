import { z } from 'zod'
import { entityIdSchema } from './common'

export const createTagSchema = z.object({
  name: z.string().trim().min(1, 'Name is required')
})

export const updateTagSchema = z.object({
  name: z.string().trim().min(1).optional()
})

export const tagIdSchema = z.object({
  id: entityIdSchema
})

export const updateTagRequestSchema = z.object({
  id: entityIdSchema,
  input: updateTagSchema
})
