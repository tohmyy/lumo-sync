import { useCallback, useEffect, useState, type JSX } from 'react'
import type { Asset, Device } from '../../shared/types'
import { AppEvents } from '../../shared/constants'

export function DebugPanel(): JSX.Element {
  const [device, setDevice] = useState<Device | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const refresh = useCallback(async () => {
    setError('')
    const [deviceResult, assetsResult] = await Promise.all([
      window.lumosync.device.getCurrent(),
      window.lumosync.assets.list()
    ])

    if (!deviceResult.ok) {
      setError(deviceResult.error.message)
      return
    }
    if (!assetsResult.ok) {
      setError(assetsResult.error.message)
      return
    }

    setDevice(deviceResult.data)
    setAssets(assetsResult.data)
  }, [])

  useEffect(() => {
    void refresh()
    const offUpdated = window.lumosync.events.on(AppEvents.assetUpdated, () => {
      void refresh()
    })
    const offDeleted = window.lumosync.events.on(AppEvents.assetDeleted, () => {
      void refresh()
    })
    return () => {
      offUpdated()
      offDeleted()
    }
  }, [refresh])

  async function handleCreate(): Promise<void> {
    setError('')
    const result = await window.lumosync.assets.create({
      type: 'snippet',
      title: `Sample snippet ${assets.length + 1}`,
      language: 'typescript',
      description: 'Created via Phase 2 IPC smoke test',
      content: 'export const hello = "lumosync"',
      tags: ['demo']
    })

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setMessage(`Created asset ${result.data.id}`)
    await refresh()
  }

  return (
    <section className="debug-panel">
      <div className="debug-card">
        <h2>IPC smoke test</h2>
        <p>
          Verifies typed preload APIs against the main process. Full Library UI arrives in Phase 3.
        </p>
        <div className="debug-actions">
          <button type="button" onClick={() => void handleCreate()}>
            Create sample asset
          </button>
          <button type="button" className="secondary" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
        {message ? <p className="ok">{message}</p> : null}
        {error ? <p className="err">{error}</p> : null}
      </div>

      <div className="debug-card">
        <h3>Current device</h3>
        {device ? (
          <dl>
            <div>
              <dt>Name</dt>
              <dd>{device.name}</dd>
            </div>
            <div>
              <dt>Platform</dt>
              <dd>{device.platform}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd>
                <code>{device.id}</code>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="muted">Loading device…</p>
        )}
      </div>

      <div className="debug-card">
        <h3>Assets ({assets.length})</h3>
        {assets.length === 0 ? (
          <p className="muted">No assets yet. Create one to prove IPC + SQLite persistence.</p>
        ) : (
          <ul className="asset-list">
            {assets.map((asset) => (
              <li key={asset.id}>
                <strong>{asset.title}</strong>
                <span>
                  {asset.type} · v{asset.version}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
