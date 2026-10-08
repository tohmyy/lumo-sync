import { createLogger } from '../logging/logger'
import type { SyncEngine } from './sync-engine'

const log = createLogger('sync-scheduler')

/** Debounced sync triggers for startup and local mutations. */
export class SyncScheduler {
  private timer: ReturnType<typeof setTimeout> | null = null
  private readonly debounceMs: number

  constructor(
    private readonly engine: SyncEngine,
    debounceMs = 750
  ) {
    this.debounceMs = debounceMs
  }

  start(): void {
    this.schedule(1200)
    log.info('Sync scheduler started')
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  schedule(delayMs = this.debounceMs): void {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.timer = setTimeout(() => {
      this.timer = null
      void this.engine.sync()
    }, delayMs)
  }

  /** Call after any local asset mutation that enqueued a sync operation. */
  scheduleAfterMutation(): void {
    this.engine.markPendingIfIdle()
    this.schedule()
  }
}
