import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JSX } from 'react'
import type { SyncStatusSnapshot } from '../../../shared/types'
import { syncApi } from '../../lib/ipc'
import { syncKeys } from '../../lib/query-client'
import { useLibraryStore } from '../../stores/library-store'

function labelFor(snapshot: SyncStatusSnapshot): string {
  if (snapshot.status === 'syncing') return 'Syncing…'
  if (snapshot.status === 'conflict') {
    return snapshot.conflictCount === 1
      ? '1 conflict'
      : `${snapshot.conflictCount} conflicts`
  }
  if (snapshot.status === 'error') return 'Sync error'
  if (snapshot.status === 'pending' || snapshot.pendingCount > 0) {
    return snapshot.pendingCount > 0
      ? `${snapshot.pendingCount} pending`
      : 'Pending'
  }
  if (snapshot.status === 'offline') return 'Offline'
  if (snapshot.status === 'synced') return 'Synced'
  return 'Sync'
}

function toneFor(snapshot: SyncStatusSnapshot): string {
  if (snapshot.status === 'conflict' || snapshot.status === 'error') return 'danger'
  if (snapshot.status === 'syncing' || snapshot.status === 'pending') return 'busy'
  if (snapshot.status === 'synced') return 'ok'
  return 'neutral'
}

function formatRelative(iso: string | null): string | null {
  if (!iso) return null
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return null
  const diffSec = Math.round((Date.now() - then) / 1000)
  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

export function SyncStatusIndicator(): JSX.Element {
  const setView = useLibraryStore((s) => s.setView)
  const queryClient = useQueryClient()

  const statusQuery = useQuery({
    queryKey: syncKeys.status(),
    queryFn: () => syncApi.status(),
    refetchInterval: 15_000
  })

  const syncMutation = useMutation({
    mutationFn: () => syncApi.now(),
    onSuccess: (data) => {
      queryClient.setQueryData(syncKeys.status(), data)
      void queryClient.invalidateQueries({ queryKey: syncKeys.conflicts() })
    }
  })

  const snapshot = statusQuery.data
  const label = snapshot ? labelFor(snapshot) : 'Sync'
  const tone = snapshot ? toneFor(snapshot) : 'neutral'
  const relative = formatRelative(snapshot?.lastSuccessfulSyncAt ?? null)

  return (
    <div className="sync-indicator">
      <button
        type="button"
        className={`sync-pill sync-pill-${tone}`}
        onClick={() => setView(snapshot?.conflictCount ? 'conflicts' : 'sync')}
        title={snapshot?.lastError ?? 'Open sync'}
      >
        <span className="sync-pill-dot" aria-hidden />
        <span>{label}</span>
        {relative ? <span className="sync-pill-meta">{relative}</span> : null}
      </button>
      <button
        type="button"
        className="sync-now-btn"
        disabled={syncMutation.isPending || snapshot?.status === 'syncing'}
        onClick={() => syncMutation.mutate()}
      >
        {syncMutation.isPending ? 'Syncing…' : 'Sync Now'}
      </button>
    </div>
  )
}
