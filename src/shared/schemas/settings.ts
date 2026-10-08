import { z } from 'zod'

export const settingsGetSchema = z.object({
  key: z.string().min(1)
})

export const settingsUpdateSchema = z.object({
  key: z.string().min(1),
  value: z.string()
})
