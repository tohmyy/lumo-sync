import pino from 'pino'

const level = process.env.LUMOSYNC_LOG_LEVEL ?? 'info'

const root = pino({
  level,
  base: { app: 'lumosync' },
  timestamp: pino.stdTimeFunctions.isoTime
})

export function createLogger(name: string): pino.Logger {
  return root.child({ module: name })
}

export const logger = root
