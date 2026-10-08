import type { AppError } from '../errors/app-error'

export type IpcSuccess<T> = { ok: true; data: T }
export type IpcFailure = { ok: false; error: AppError }
export type IpcResult<T> = IpcSuccess<T> | IpcFailure

export function ipcOk<T>(data: T): IpcSuccess<T> {
  return { ok: true, data }
}

export function ipcFail(error: AppError): IpcFailure {
  return { ok: false, error }
}
