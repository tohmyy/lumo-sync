import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type JSX } from 'react'
import { AppErrorException } from '../../../shared/errors'
import { tagsApi } from '../../lib/ipc'
import { tagKeys } from '../../lib/query-client'
import { useLibraryStore } from '../../stores/library-store'

function errorMessage(error: unknown): string {
  if (error instanceof AppErrorException) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function TagsPage(): JSX.Element {
  const queryClient = useQueryClient()
  const filterByTag = useLibraryStore((s) => s.filterByTag)
  const [error, setError] = useState<string | null>(null)

  const tagsQuery = useQuery({
    queryKey: tagKeys.list(),
    queryFn: () => tagsApi.list()
  })

  const createMutation = useMutation({
    mutationFn: tagsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tagKeys.all })
      setError(null)
    },
    onError: (err) => setError(errorMessage(err))
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => tagsApi.update(id, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tagKeys.all })
      setError(null)
    },
    onError: (err) => setError(errorMessage(err))
  })

  const deleteMutation = useMutation({
    mutationFn: tagsApi.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tagKeys.all })
      setError(null)
    },
    onError: (err) => setError(errorMessage(err))
  })

  return (
    <section className="org-page">
      <div className="org-page-header">
        <div>
          <p className="eyebrow">Organize</p>
          <h2>Tags</h2>
          <p className="muted">Reusable labels for filtering your library.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            const name = window.prompt('Tag name')
            if (!name?.trim()) return
            createMutation.mutate({ name: name.trim() })
          }}
        >
          + New Tag
        </button>
      </div>

      {error ? <p className="err-text">{error}</p> : null}
      {tagsQuery.isLoading ? <p className="muted">Loading tags…</p> : null}

      {!tagsQuery.isLoading && (tagsQuery.data?.length ?? 0) === 0 ? (
        <div className="asset-empty">
          <h3>No tags yet</h3>
          <p>Create tags here or add them while editing an asset.</p>
        </div>
      ) : null}

      <div className="tags-manage-list">
        {(tagsQuery.data ?? []).map((tag) => (
          <div key={tag.id} className="tag-manage-row">
            <button type="button" className="tag-chip clickable" onClick={() => filterByTag(tag.name)}>
              {tag.name}
            </button>
            <div className="collection-card-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const name = window.prompt('Rename tag', tag.name)
                  if (!name?.trim()) return
                  updateMutation.mutate({ id: tag.id, name: name.trim() })
                }}
              >
                Rename
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (!window.confirm(`Delete tag “${tag.name}”?`)) return
                  deleteMutation.mutate(tag.id)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
