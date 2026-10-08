import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppEvents } from '../../shared/constants'
import { assetKeys, deviceKeys, syncKeys } from '../lib/query-client'

export function useSyncEvents(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const invalidateSync = (): void => {
      void queryClient.invalidateQueries({ queryKey: syncKeys.all })
      void queryClient.invalidateQueries({ queryKey: deviceKeys.all })
    }

    const onAsset = (): void => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all })
    }

    const offStatus = window.lumosync.events.on(AppEvents.syncStatusChanged, invalidateSync)
    const offConflict = window.lumosync.events.on(AppEvents.syncConflict, () => {
      invalidateSync()
      onAsset()
    })
    const offDevice = window.lumosync.events.on(AppEvents.deviceUpdated, invalidateSync)
    const offAsset = window.lumosync.events.on(AppEvents.assetUpdated, onAsset)

    return () => {
      offStatus()
      offConflict()
      offDevice()
      offAsset()
    }
  }, [queryClient])
}
