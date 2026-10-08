export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'ASSET_NOT_FOUND'
  | 'COLLECTION_NOT_FOUND'
  | 'TAG_NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'SYNC_ERROR'
  | 'CONFLICT_DETECTED'
  | 'AUTH_REQUIRED'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'

export interface AppError {
  code: ErrorCode
  message: string
  details?: unknown
}

export class AppErrorException extends Error {
  readonly code: ErrorCode
  readonly details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'AppErrorException'
    this.code = code
    this.details = details
  }

  toAppError(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details
    }
  }
}

export function isAppErrorException(error: unknown): error is AppErrorException {
  return error instanceof AppErrorException
}

export function toAppError(error: unknown): AppError {
  if (isAppErrorException(error)) {
    return error.toAppError()
  }

  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }

  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  }
}
