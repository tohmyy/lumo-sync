import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JSX } from 'react'
import type { ConflictResolution, SyncConflictRecord } from '../../../shared/types'
import { syncApi } from '../../lib/ipc'
import { assetKeys, syncKeys } from '../../lib/query-client'

interface ConflictPayload {
  id: string
  title: string
  content: string
  version: number
  type?: string
  language?: string | null
}

function parsePayload(raw: string): ConflictPayload {
  try {
    const parsed = JSON.parse(raw) as ConflictPayload
    return {
      id: parsed.id,
      title: parsed.title || 'Untitled',
      content: parsed.content || '',
      version: parsed.version ?? 0,
      type: parsed.type,
      language: parsed.language
    }
  } catch {
    return { id: 'unknown', title: 'Unreadable payload', content: raw, version: 0 }
  }
}

function ConflictCard({
  conflict,
  onResolve,
  busy
}: {
  conflict: SyncConflictRecord
  onResolve: (id: string, resolution: ConflictResolution) => void
  busy: boolean
}): JSX.Element {
  const local = parsePayload(conflict.localPayload)
  const remote = parsePayload(conflict.remotePayload)

  return (
    <article className="conflict-card">
      <header>
        <h3>{local.title || remote.title}</h3>
        <p>
          Changed on two devices · detected{' '}
          {new Date(conflict.detectedAt).toLocaleString()}
        </p>
      </header>

      <div className="conflict-compare">
        <div className="conflict-side">
          <h4>
            Local <span>v{conflict.localVersion ?? local.version}</span>
          </h4>
          <p className="conflict-title">{local.title}</p>
          <pre>{local.content}</pre>
        </div>
        <div className="conflict-side">
          <h4>
            Remote <span>v{conflict.remoteVersion ?? remote.version}</span>
          </h4>
          <p className="conflict-title">{remote.title}</p>
          <pre>{remote.content}</pre>
        </div>
      </div>

      <div className="conflict-actions">
        <button
          type="button"
          disabled={busy}
          onClick={() => onResolve(conflict.id, 'keep_local')}
        >
          Keep Local
        </button>
        <button
          type="button"
          className="primary-btn"
          disabled={busy}
          onClick={() => onResolve(conflict.id, 'keep_remote')}
        >
          Keep Remote
        </button>
      </div>
    </article>
  )
}

export function ConflictsPage(): JSX.Element {
  const queryClient = useQueryClient()

  const conflictsQuery = useQuery({
    queryKey: syncKeys.conflicts(),
    queryFn: () => syncApi.listConflicts()
  })

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      resolution
    }: {
      id: string
      resolution: ConflictResolution
    }) => syncApi.resolveConflict(id, resolution),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: syncKeys.all })
      await queryClient.invalidateQueries({ queryKey: assetKeys.all })
    }
  })

  const conflicts = conflictsQuery.data ?? []

  return (
    <div className="conflicts-page">
      <p className="sync-hint">
        {conflicts.length === 0
          ? 'No conflicts need attention.'
          : `${conflicts.length} asset${conflicts.length === 1 ? '' : 's'} need your attention. Neither version is discarded until you choose.`}
      </p>

      <div className="conflict-list">
        {conflicts.map((conflict) => (
          <ConflictCard
            key={conflict.id}
            conflict={conflict}
            busy={resolveMutation.isPending}
            onResolve={(id, resolution) =>
              resolveMutation.mutate({ id, resolution })
            }
          />
        ))}
      </div>
    </div>
  )
}
