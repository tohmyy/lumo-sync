import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppEvents } from '../../shared/constants'
import { assetKeys } from '../lib/query-client'

export function useAssetEvents(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const invalidate = (payload: unknown): void => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all })
      if (
        payload &&
        typeof payload === 'object' &&
        'id' in payload &&
        typeof (payload as { id: unknown }).id === 'string'
      ) {
        void queryClient.invalidateQueries({
          queryKey: assetKeys.detail((payload as { id: string }).id)
        })
      }
    }

    const offUpdated = window.lumosync.events.on(AppEvents.assetUpdated, invalidate)
    const offDeleted = window.lumosync.events.on(AppEvents.assetDeleted, invalidate)
    return () => {
      offUpdated()
      offDeleted()
    }
  }, [queryClient])
}
