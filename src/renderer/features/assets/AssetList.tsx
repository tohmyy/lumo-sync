import type { JSX } from 'react'
import type { Asset, AssetSortBy, AssetType, Tag } from '../../../shared/types'
import { AssetEmptyState } from './AssetEmptyState'
import { AssetRow } from './AssetRow'

const ASSET_TYPES: AssetType[] = ['snippet', 'command', 'config', 'note', 'template']

const SORT_OPTIONS: Array<{ value: AssetSortBy; label: string }> = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'created', label: 'Recently Created' },
  { value: 'title', label: 'Alphabetical' },
  { value: 'opened', label: 'Recently Opened' }
]

interface AssetListProps {
  heading: string
  description: string
  assets: Asset[]
  tags: Tag[]
  selectedId: string | null
  loading: boolean
  error: string | null
  searchInput: string
  showDeleted: boolean
  showDeletedToggle: boolean
  typeFilter: AssetType | ''
  tagFilter: string
  sortBy: AssetSortBy
  onSearchChange: (value: string) => void
  onShowDeletedChange: (value: boolean) => void
  onTypeFilterChange: (value: AssetType | '') => void
  onTagFilterChange: (value: string) => void
  onSortByChange: (value: AssetSortBy) => void
  onSelect: (id: string) => void
  onCreate: () => void
  onRetry: () => void
  emptyTitle?: string
  emptyDescription?: string
  showCreate?: boolean
}

export function AssetList({
  heading,
  description,
  assets,
  tags,
  selectedId,
  loading,
  error,
  searchInput,
  showDeleted,
  showDeletedToggle,
  typeFilter,
  tagFilter,
  sortBy,
  onSearchChange,
  onShowDeletedChange,
  onTypeFilterChange,
  onTagFilterChange,
  onSortByChange,
  onSelect,
  onCreate,
  onRetry,
  emptyTitle,
  emptyDescription,
  showCreate = true
}: AssetListProps): JSX.Element {
  return (
    <section className="asset-list-panel">
      <div className="asset-list-toolbar">
        <div className="asset-list-heading">
          <p className="eyebrow">Organize</p>
          <h2>{heading}</h2>
          <p className="muted">{description}</p>
        </div>
        {showCreate ? (
          <button type="button" className="btn-primary" onClick={onCreate}>
            + New Asset
          </button>
        ) : null}
      </div>

      <div className="asset-list-controls">
        <input
          type="search"
          className="search-input"
          placeholder="Search assets..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="filter-row">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as AssetSortBy)}
            aria-label="Sort assets"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as AssetType | '')}
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            {ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={(e) => onTagFilterChange(e.target.value)}
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
        {showDeletedToggle ? (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => onShowDeletedChange(e.target.checked)}
            />
            Show deleted
          </label>
        ) : null}
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
          title={emptyTitle ?? (searchInput ? 'No matches' : 'No assets yet')}
          description={
            emptyDescription ??
            (searchInput
              ? 'Try a different search term or clear filters.'
              : 'Create your first snippet, command, note, or template.')
          }
          actionLabel={showCreate && !searchInput ? '+ New Asset' : undefined}
          onAction={showCreate && !searchInput ? onCreate : undefined}
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
