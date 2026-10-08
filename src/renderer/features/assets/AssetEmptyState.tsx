import type { JSX } from 'react'

interface AssetEmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function AssetEmptyState({
  title,
  description,
  actionLabel,
  onAction
}: AssetEmptyStateProps): JSX.Element {
  return (
    <div className="asset-empty">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <button type="button" className="btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
