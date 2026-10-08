import type { JSX } from 'react'
import type { Asset } from '../../../shared/types'
import { AssetEmptyState } from './AssetEmptyState'
import { AssetRow } from './AssetRow'

interface AssetListProps {
  assets: Asset[]
  selectedId: string | null
  loading: boolean
  error: string | null
  search: string
  showDeleted: boolean
  onSearchChange: (value: string) => void
  onShowDeletedChange: (value: boolean) => void
  onSelect: (id: string) => void
  onCreate: () => void
  onRetry: () => void
}

export function AssetList({
  assets,
  selectedId,
  loading,
  error,
  search,
  showDeleted,
  onSearchChange,
  onShowDeletedChange,
  onSelect,
  onCreate,
  onRetry
}: AssetListProps): JSX.Element {
  return (
    <section className="asset-list-panel">
      <div className="asset-list-toolbar">
        <div className="asset-list-heading">
          <p className="eyebrow">Library</p>
          <h2>All Assets</h2>
          <p className="muted">Everything you&apos;ve saved in LumoSync.</p>
        </div>
        <button type="button" className="btn-primary" onClick={onCreate}>
          + New Asset
        </button>
      </div>

      <div className="asset-list-controls">
        <input
          type="search"
          className="search-input"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => onShowDeletedChange(e.target.checked)}
          />
          Show deleted
        </label>
      </div>

      {loading ? <p className="muted padded">Loading assets…</p> : null}

      {error ? (
        <div className="asset-error">
          <p>{error}</p>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && assets.length === 0 ? (
        <AssetEmptyState
          title={search ? 'No matches' : 'No assets yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Create your first snippet, command, note, or template.'
          }
          actionLabel={search ? undefined : '+ New Asset'}
          onAction={search ? undefined : onCreate}
        />
      ) : null}

      {!loading && !error && assets.length > 0 ? (
        <div className="asset-rows">
          {assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              selected={asset.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
