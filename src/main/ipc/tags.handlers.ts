import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/constants'
import { createTagSchema, tagIdSchema, updateTagRequestSchema } from '../../shared/schemas'
import type { Services } from '../services'
import { handleIpc } from './handler-utils'

export function registerTagHandlers(services: Services): void {
  ipcMain.handle(
    IpcChannels.tag.list,
    handleIpc(null, () => services.tags.list())
  )

  ipcMain.handle(
    IpcChannels.tag.create,
    handleIpc(createTagSchema, (input) => services.tags.create(input))
  )

  ipcMain.handle(
    IpcChannels.tag.update,
    handleIpc(updateTagRequestSchema, ({ id, input }) => services.tags.update(id, input))
  )

  ipcMain.handle(
    IpcChannels.tag.delete,
    handleIpc(tagIdSchema, ({ id }) => {
      services.tags.delete(id)
      return { id }
    })
  )
}
