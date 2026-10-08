import { QueryClient } from '@tanstack/react-query'
import { AppErrorException, type AppError } from '../../shared/errors'
import type { IpcResult } from '../../shared/types'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      retry: false,
      refetchOnWindowFocus: false
    }
  }
})

export async function unwrapIpc<T>(promise: Promise<IpcResult<T>>): Promise<T> {
  const result = await promise
  if (!result.ok) {
    throw toIpcError(result.error)
  }
  return result.data
}

export function toIpcError(error: AppError): AppErrorException {
  return new AppErrorException(error.code, error.message, error.details)
}

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const
}

export const collectionKeys = {
  all: ['collections'] as const,
  list: () => [...collectionKeys.all, 'list'] as const,
  detail: (id: string) => [...collectionKeys.all, 'detail', id] as const
}

export const tagKeys = {
  all: ['tags'] as const,
  list: () => [...tagKeys.all, 'list'] as const
}

export const recentKeys = {
  all: ['recent'] as const,
  list: () => [...recentKeys.all, 'list'] as const
}
