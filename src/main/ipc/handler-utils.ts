import type { IpcMainInvokeEvent } from 'electron'
import type { ZodSchema } from 'zod'
import { ZodError } from 'zod'
import { AppErrorException, isAppErrorException, toAppError } from '../../shared/errors'
import { ipcFail, ipcOk, type IpcResult } from '../../shared/types'
import { createLogger } from '../logging/logger'

const log = createLogger('ipc')

export function handleIpc<TInput, TOutput>(
  schema: ZodSchema<TInput> | null,
  handler: (input: TInput) => TOutput
): (_event: IpcMainInvokeEvent, raw?: unknown) => IpcResult<TOutput> {
  return (_event, raw) => {
    try {
      const input = schema ? schema.parse(raw ?? undefined) : (undefined as TInput)
      const data = handler(input)
      return ipcOk(data)
    } catch (error) {
      if (error instanceof ZodError) {
        return ipcFail({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: error.flatten()
        })
      }

      if (isAppErrorException(error)) {
        return ipcFail(error.toAppError())
      }

      log.error({ err: error }, 'Unhandled IPC error')
      return ipcFail(toAppError(error))
    }
  }
}

export function requireDevice(): never {
  throw new AppErrorException('INTERNAL_ERROR', 'Device not initialized')
}
