import { z } from 'zod'

/** Accepts UUIDv4–v7 (Zod's built-in uuid() rejects v7). */
export const entityIdSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Invalid ID'
  )
