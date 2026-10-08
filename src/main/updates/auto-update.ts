import { app } from 'electron'
import { createLogger } from '../logging/logger'

const log = createLogger('updates')

export type UpdateStatus =
  | 'disabled'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloaded'
  | 'error'

export interface UpdateSnapshot {
  status: UpdateStatus
  version: string | null
  message: string | null
}

/**
 * Optional auto-update wiring. Enabled only for packaged builds when
 * LUMOSYNC_UPDATE_URL (generic provider) or GitHub publish config is set.
 */
export async function initAutoUpdater(): Promise<UpdateSnapshot> {
  if (!app.isPackaged) {
    return { status: 'disabled', version: null, message: 'Dev builds skip update checks' }
  }

  const feedUrl = process.env.LUMOSYNC_UPDATE_URL
  if (!feedUrl) {
    log.info('No LUMOSYNC_UPDATE_URL configured; auto-update disabled')
    return {
      status: 'disabled',
      version: null,
      message: 'Set LUMOSYNC_UPDATE_URL to enable updates'
    }
  }

  try {
    const { autoUpdater } = await import('electron-updater')
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl })

    autoUpdater.on('error', (error) => {
      log.error({ err: error }, 'Auto-update error')
    })
    autoUpdater.on('update-available', (info) => {
      log.info({ version: info.version }, 'Update available')
    })
    autoUpdater.on('update-downloaded', (info) => {
      log.info({ version: info.version }, 'Update downloaded; will install on quit')
    })

    const result = await autoUpdater.checkForUpdates()
    const version = result?.updateInfo?.version ?? null
    return {
      status: version && version !== app.getVersion() ? 'available' : 'not-available',
      version,
      message: null
    }
  } catch (error) {
    log.warn({ err: error }, 'Auto-update check failed')
    return {
      status: 'error',
      version: null,
      message: error instanceof Error ? error.message : 'Update check failed'
    }
  }
}
