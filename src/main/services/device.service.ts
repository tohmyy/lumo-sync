import type { Device } from '../../shared/types'
import { AppErrorException } from '../../shared/errors'
import type { Repositories } from '../database/repositories'

export class DeviceService {
  constructor(private readonly repos: Repositories) {}

  getCurrent(): Device {
    const device = this.repos.devices.getCurrent()
    if (!device) {
      throw new AppErrorException('NOT_FOUND', 'Current device not initialized')
    }
    return device
  }
}
