import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type JSX } from 'react'
import { AppErrorException } from '../../../shared/errors'
import { collectionsApi } from '../../lib/ipc'
import { collectionKeys } from '../../lib/query-client'
import { useLibraryStore } from '../../stores/library-store'

function errorMessage(error: unknown): string {
  if (error instanceof AppErrorException) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function CollectionsPage(): JSX.Element {
  const queryClient = useQueryClient()
  const openCollection = useLibraryStore((s) => s.openCollection)
  const [error, setError] = useState<string | null>(null)

  const collectionsQuery = useQuery({
    queryKey: collectionKeys.list(),
    queryFn: () => collectionsApi.list()
  })

  const createMutation = useMutation({
    mutationFn: collectionsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      setError(null)
    },
    onError: (err) => setError(errorMessage(err))
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      collectionsApi.update(id, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      setError(null)
    },
    onError: (err) => setError(errorMessage(err))
  })

  const deleteMutation = useMutation({
    mutationFn: collectionsApi.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      setError(null)
    },
    onError: (err) => setError(errorMessage(err))
  })

  return (
    <section className="org-page">
      <div className="org-page-header">
        <div>
          <p className="eyebrow">Organize</p>
          <h2>Collections</h2>
          <p className="muted">Group related assets into focused toolkits.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            const name = window.prompt('Collection name')
            if (!name?.trim()) return
            createMutation.mutate({ name: name.trim() })
          }}
        >
          + New Collection
        </button>
      </div>

      {error ? <p className="err-text">{error}</p> : null}
      {collectionsQuery.isLoading ? <p className="muted">Loading collections…</p> : null}

      {!collectionsQuery.isLoading && (collectionsQuery.data?.length ?? 0) === 0 ? (
        <div className="asset-empty">
          <h3>No collections yet</h3>
          <p>Create a collection to organize snippets, commands, and notes.</p>
        </div>
      ) : null}

      <div className="collection-grid">
        {(collectionsQuery.data ?? []).map((collection) => (
          <article key={collection.id} className="collection-card">
            <button
              type="button"
              className="collection-card-main"
              onClick={() => openCollection(collection.id)}
            >
              <h3>{collection.name}</h3>
              <p>
                {collection.assetCount} asset{collection.assetCount === 1 ? '' : 's'}
              </p>
              {collection.description ? (
                <p className="muted">{collection.description}</p>
              ) : null}
            </button>
            <div className="collection-card-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const name = window.prompt('Rename collection', collection.name)
                  if (!name?.trim()) return
                  updateMutation.mutate({ id: collection.id, name: name.trim() })
                }}
              >
                Rename
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (!window.confirm(`Delete collection “${collection.name}”?`)) return
                  deleteMutation.mutate(collection.id)
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
