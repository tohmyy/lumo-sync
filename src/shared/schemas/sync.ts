import { z } from 'zod'
import { entityIdSchema } from './common'

export const conflictResolutionSchema = z.enum(['keep_local', 'keep_remote'])

export const resolveConflictSchema = z.object({
  id: entityIdSchema,
  resolution: conflictResolutionSchema
})

export type ResolveConflictInput = z.infer<typeof resolveConflictSchema>
