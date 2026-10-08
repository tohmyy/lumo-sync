import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JSX } from 'react'
import { deviceApi, syncApi } from '../../lib/ipc'
import { deviceKeys, syncKeys } from '../../lib/query-client'
import { useLibraryStore } from '../../stores/library-store'

function formatWhen(iso: string | null): string {
  if (!iso) return 'Never'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function SyncPage(): JSX.Element {
  const setView = useLibraryStore((s) => s.setView)
  const queryClient = useQueryClient()

  const statusQuery = useQuery({
    queryKey: syncKeys.status(),
    queryFn: () => syncApi.status()
  })

  const devicesQuery = useQuery({
    queryKey: deviceKeys.list(),
    queryFn: () => deviceApi.list()
  })

  const syncMutation = useMutation({
    mutationFn: () => syncApi.now(),
    onSuccess: (data) => {
      queryClient.setQueryData(syncKeys.status(), data)
      void queryClient.invalidateQueries({ queryKey: deviceKeys.all })
      void queryClient.invalidateQueries({ queryKey: syncKeys.conflicts() })
    }
  })

  const status = statusQuery.data
  const devices = devicesQuery.data
  const remoteById = new Map((devices?.remote ?? []).map((d) => [d.id, d]))

  return (
    <div className="sync-page">
      <section className="sync-panel">
        <h2>Status</h2>
        <dl className="sync-stats">
          <div>
            <dt>State</dt>
            <dd className={`sync-state sync-state-${status?.status ?? 'idle'}`}>
              {status?.status ?? '…'}
            </dd>
          </div>
          <div>
            <dt>Last successful sync</dt>
            <dd>{formatWhen(status?.lastSuccessfulSyncAt ?? null)}</dd>
          </div>
          <div>
            <dt>Pending changes</dt>
            <dd>{status?.pendingCount ?? 0}</dd>
          </div>
          <div>
            <dt>Conflicts</dt>
            <dd>
              {status?.conflictCount ?? 0}
              {(status?.conflictCount ?? 0) > 0 ? (
                <button
                  type="button"
                  className="linkish"
                  onClick={() => setView('conflicts')}
                >
                  Review
                </button>
              ) : null}
            </dd>
          </div>
        </dl>

        {status?.lastError ? (
          <p className="sync-error-banner">
            Synchronization paused. Your local changes are safe.
            <span>{status.lastError}</span>
          </p>
        ) : null}

        <div className="sync-actions">
          <button
            type="button"
            className="primary-btn"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate()}
          >
            {syncMutation.isPending ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      </section>

      <section className="sync-panel">
        <h2>Devices</h2>
        <p className="sync-hint">
          Devices that have registered with the shared sync store. Point multiple app
          instances at the same <code>LUMOSYNC_SYNC_STORE</code> path to demo multi-device
          sync.
        </p>
        <ul className="device-list">
          {(devices?.local ?? []).map((device) => {
            const remote = remoteById.get(device.id)
            return (
              <li key={device.id} className="device-row">
                <div>
                  <strong>
                    {device.name}
                    {device.isCurrent ? (
                      <span className="device-current">This device</span>
                    ) : null}
                  </strong>
                  <p>
                    {device.platform}
                    {device.appVersion ? ` · v${device.appVersion}` : ''}
                  </p>
                </div>
                <div className="device-meta">
                  <span>{remote ? 'Connected' : device.isCurrent ? 'Local' : 'Seen'}</span>
                  <span>
                    Last seen{' '}
                    {formatWhen(remote?.lastSeenAt ?? device.lastSeenAt)}
                  </span>
                </div>
              </li>
            )
          })}
          {(devices?.remote ?? [])
            .filter((r) => !(devices?.local ?? []).some((l) => l.id === r.id))
            .map((device) => (
              <li key={device.id} className="device-row">
                <div>
                  <strong>{device.name}</strong>
                  <p>
                    {device.platform}
                    {device.appVersion ? ` · v${device.appVersion}` : ''}
                  </p>
                </div>
                <div className="device-meta">
                  <span>Remote only</span>
                  <span>Last seen {formatWhen(device.lastSeenAt)}</span>
                </div>
              </li>
            ))}
        </ul>
        {!devicesQuery.isLoading && (devices?.local.length ?? 0) === 0 ? (
          <p className="empty-inline">No devices registered yet.</p>
        ) : null}
      </section>
    </div>
  )
}
