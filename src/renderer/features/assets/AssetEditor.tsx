import { useEffect, type JSX } from 'react'
import type { AssetType } from '../../../shared/types'
import type { AssetDraft } from '../../stores/library-store'

const ASSET_TYPES: AssetType[] = ['snippet', 'command', 'config', 'note', 'template']

interface AssetEditorProps {
  title: string
  draft: AssetDraft
  saving: boolean
  error: string | null
  isDirty: boolean
  onChange: (patch: Partial<AssetDraft>) => void
  onSave: () => void
  onCancel: () => void
}

export function AssetEditor({
  title,
  draft,
  saving,
  error,
  isDirty,
  onChange,
  onSave,
  onCancel
}: AssetEditorProps): JSX.Element {
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  return (
    <section className="asset-editor-panel">
      <header className="asset-editor-header">
        <h2>{title}</h2>
        <div className="asset-detail-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onSave}
            disabled={saving || !draft.title.trim()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {error ? <p className="err-text">{error}</p> : null}
      {isDirty ? <p className="muted">Unsaved changes</p> : null}

      <label className="field">
        <span>Title</span>
        <input
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Asset title"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Type</span>
          <select
            value={draft.type}
            onChange={(e) => onChange({ type: e.target.value as AssetType })}
          >
            {ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Language</span>
          <input
            value={draft.language}
            onChange={(e) => onChange({ language: e.target.value })}
            placeholder="typescript"
          />
        </label>
      </div>

      <label className="field">
        <span>Description</span>
        <textarea
          rows={2}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Optional description"
        />
      </label>

      <label className="field">
        <span>Content</span>
        <textarea
          className="content-editor"
          rows={14}
          value={draft.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Paste or write your asset content"
          spellCheck={false}
        />
      </label>

      <label className="field">
        <span>Tags</span>
        <input
          value={draft.tagsText}
          onChange={(e) => onChange({ tagsText: e.target.value })}
          placeholder="comma, separated, tags"
        />
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={draft.isFavorite}
          onChange={(e) => onChange({ isFavorite: e.target.checked })}
        />
        Favorite
      </label>
    </section>
  )
}
