import { useState, type JSX } from 'react'
import type { Asset, CollectionWithCount } from '../../../shared/types'
import { AssetEmptyState } from './AssetEmptyState'

interface AssetDetailProps {
  asset: Asset | null
  collections: CollectionWithCount[]
  membershipIds: string[]
  loading: boolean
  error: string | null
  onEdit: () => void
  onFavorite: () => void
  onDelete: () => void
  onRestore: () => void
  onTagClick: (tag: string) => void
  onAddToCollection: (collectionId: string) => void
  onRemoveFromCollection: (collectionId: string) => void
  busy?: boolean
}

function formatUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function AssetDetail({
  asset,
  collections,
  membershipIds,
  loading,
  error,
  onEdit,
  onFavorite,
  onDelete,
  onRestore,
  onTagClick,
  onAddToCollection,
  onRemoveFromCollection,
  busy
}: AssetDetailProps): JSX.Element {
  const [copied, setCopied] = useState(false)

  if (loading) {
    return (
      <section className="asset-detail-panel">
        <p className="muted padded">Loading asset…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="asset-detail-panel">
        <div className="asset-error padded">
          <p>{error}</p>
        </div>
      </section>
    )
  }

  if (!asset) {
    return (
      <section className="asset-detail-panel">
        <AssetEmptyState
          title="Select an asset"
          description="Choose an item from the list, or create a new one."
        />
      </section>
    )
  }

  async function handleCopy(): Promise<void> {
    if (!asset) return
    try {
      await navigator.clipboard.writeText(asset.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const isDeleted = Boolean(asset.deletedAt)
  const memberSet = new Set(membershipIds)

  return (
    <section className="asset-detail-panel">
      <header className="asset-detail-header">
        <div>
          <h2>{asset.title}</h2>
          <p className="asset-detail-meta">
            {asset.type}
            {asset.language ? ` · ${asset.language}` : ''}
            {' · '}
            Updated {formatUpdated(asset.updatedAt)}
          </p>
        </div>
        <div className="asset-detail-actions">
          <button type="button" className="btn-secondary" onClick={() => void handleCopy()}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          {!isDeleted ? (
            <>
              <button type="button" className="btn-secondary" onClick={onEdit} disabled={busy}>
                Edit
              </button>
              <button type="button" className="btn-secondary" onClick={onFavorite} disabled={busy}>
                {asset.isFavorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button type="button" className="btn-danger" onClick={onDelete} disabled={busy}>
                Delete
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary" onClick={onRestore} disabled={busy}>
              Restore
            </button>
          )}
        </div>
      </header>

      {isDeleted ? <p className="badge-deleted inline">This asset is deleted</p> : null}

      {asset.description ? <p className="asset-detail-description">{asset.description}</p> : null}

      {asset.tags.length > 0 ? (
        <div className="tag-chips">
          {asset.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-chip clickable"
              onClick={() => onTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      {!isDeleted && collections.length > 0 ? (
        <div className="collection-membership">
          <p className="field-label">Collections</p>
          <div className="collection-membership-list">
            {collections.map((collection) => {
              const inCollection = memberSet.has(collection.id)
              return (
                <label key={collection.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={inCollection}
                    disabled={busy}
                    onChange={() => {
                      if (inCollection) onRemoveFromCollection(collection.id)
                      else onAddToCollection(collection.id)
                    }}
                  />
                  {collection.name}
                </label>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="code-block">
        <div className="code-block-header">
          <span>{asset.language || asset.type}</span>
          <button type="button" className="btn-ghost" onClick={() => void handleCopy()}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <pre>
          <code>{asset.content}</code>
        </pre>
      </div>
    </section>
  )
}
