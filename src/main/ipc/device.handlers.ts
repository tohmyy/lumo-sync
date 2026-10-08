import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/constants'
import type { Services } from '../services'
import { handleIpc } from './handler-utils'

export function registerDeviceHandlers(services: Services): void {
  ipcMain.handle(
    IpcChannels.device.getCurrent,
    handleIpc(null, () => services.devices.getCurrent())
  )

  ipcMain.handle(
    IpcChannels.device.list,
    handleIpc(null, () => services.sync.listDevices())
  )
}
