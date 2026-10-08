import type { BrowserWindow } from 'electron'
import type { AppEventName } from '../../shared/constants'
import { createLogger } from '../logging/logger'

const log = createLogger('events')

export class EventBus {
  private window: BrowserWindow | null = null

  setWindow(window: BrowserWindow | null): void {
    this.window = window
  }

  emit(event: AppEventName, payload: unknown): void {
    if (!this.window || this.window.isDestroyed()) {
      log.debug({ event }, 'No window available for event')
      return
    }
    this.window.webContents.send(event, payload)
  }
}
