import type { JSX } from 'react'
import type { Asset } from '../../../shared/types'

interface AssetRowProps {
  asset: Asset
  selected: boolean
  onSelect: (id: string) => void
}

export function AssetRow({ asset, selected, onSelect }: AssetRowProps): JSX.Element {
  return (
    <button
      type="button"
      className={selected ? 'asset-row selected' : 'asset-row'}
      onClick={() => onSelect(asset.id)}
    >
      <div className="asset-row-top">
        <strong>{asset.title}</strong>
        <span className="asset-row-meta">
          {asset.language ? asset.language : asset.type}
          {asset.isFavorite ? ' ★' : ''}
        </span>
      </div>
      {asset.description ? <p className="asset-row-desc">{asset.description}</p> : null}
      <div className="asset-row-bottom">
        <span className="asset-row-tags">
          {asset.tags.length ? asset.tags.join(' · ') : asset.type}
        </span>
        {asset.deletedAt ? <span className="badge-deleted">Deleted</span> : null}
      </div>
    </button>
  )
}
