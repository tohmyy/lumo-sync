import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/constants'
import { searchQuerySchema } from '../../shared/schemas'
import type { Services } from '../services'
import { handleIpc } from './handler-utils'

export function registerSearchHandlers(services: Services): void {
  ipcMain.handle(
    IpcChannels.search.query,
    handleIpc(searchQuerySchema, ({ query, limit }) => services.search.query(query, limit))
  )
}
