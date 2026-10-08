import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { AppErrorException } from '../../../shared/errors'
import { useAssetEvents } from '../../hooks/use-asset-events'
import { assetsApi } from '../../lib/ipc'
import { assetKeys } from '../../lib/query-client'
import {
  draftFromAsset,
  draftToCreateInput,
  parseTags,
  useLibraryStore
} from '../../stores/library-store'
import { AssetDetail } from './AssetDetail'
import { AssetEditor } from './AssetEditor'
import { AssetList } from './AssetList'

function errorMessage(error: unknown): string {
  if (error instanceof AppErrorException) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function LibraryPage(): JSX.Element {
  useAssetEvents()
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    selectedId,
    mode,
    showDeleted,
    search,
    draft,
    selectAsset,
    startCreate,
    startEdit,
    setShowDeleted,
    setSearch,
    patchDraft,
    isDirty,
    resetEditor
  } = useLibraryStore()

  const listFilters = useMemo(
    () => ({
      includeDeleted: showDeleted,
      search: search.trim() || undefined
    }),
    [showDeleted, search]
  )

  const listQuery = useQuery({
    queryKey: assetKeys.list(listFilters),
    queryFn: () => assetsApi.list(listFilters)
  })

  const detailQuery = useQuery({
    queryKey: assetKeys.detail(selectedId ?? ''),
    queryFn: () => assetsApi.get(selectedId!),
    enabled: Boolean(selectedId) && mode === 'view'
  })

  useEffect(() => {
    if (!selectedId || !listQuery.data) return
    const stillVisible = listQuery.data.some((a) => a.id === selectedId)
    if (!stillVisible && mode === 'view') {
      selectAsset(null)
    }
  }, [listQuery.data, selectedId, mode, selectAsset])

  const createMutation = useMutation({
    mutationFn: assetsApi.create,
    onSuccess: async (asset) => {
      await queryClient.invalidateQueries({ queryKey: assetKeys.all })
      selectAsset(asset.id)
      setActionError(null)
    },
    onError: (error) => setActionError(errorMessage(error))
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof assetsApi.update>[1] }) =>
      assetsApi.update(id, input),
    onSuccess: async (asset) => {
      await queryClient.invalidateQueries({ queryKey: assetKeys.all })
      selectAsset(asset.id)
      setActionError(null)
    },
    onError: (error) => setActionError(errorMessage(error))
  })

  const deleteMutation = useMutation({
    mutationFn: assetsApi.delete,
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: assetKeys.all })
      if (!showDeleted) {
        selectAsset(null)
      } else {
        selectAsset(id)
      }
      setActionError(null)
    },
    onError: (error) => setActionError(errorMessage(error))
  })

  const restoreMutation = useMutation({
    mutationFn: assetsApi.restore,
    onSuccess: async (asset) => {
      await queryClient.invalidateQueries({ queryKey: assetKeys.all })
      selectAsset(asset.id)
      setActionError(null)
    },
    onError: (error) => setActionError(errorMessage(error))
  })

  function confirmDiscardIfNeeded(): boolean {
    if (!isDirty()) return true
    return window.confirm('You have unsaved changes. Discard them?')
  }

  function handleSelect(id: string): void {
    if (mode === 'create' || mode === 'edit') {
      if (!confirmDiscardIfNeeded()) return
    }
    selectAsset(id)
    setActionError(null)
  }

  function handleCreate(): void {
    if (mode === 'create' || mode === 'edit') {
      if (!confirmDiscardIfNeeded()) return
    }
    startCreate()
    setActionError(null)
  }

  function handleCancelEditor(): void {
    if (!confirmDiscardIfNeeded()) return
    if (mode === 'edit' && selectedId) {
      resetEditor()
      selectAsset(selectedId)
    } else {
      resetEditor()
      selectAsset(null)
    }
    setActionError(null)
  }

  function handleSave(): void {
    setActionError(null)
    if (mode === 'create') {
      createMutation.mutate(draftToCreateInput(draft))
      return
    }
    if (mode === 'edit' && selectedId) {
      updateMutation.mutate({
        id: selectedId,
        input: {
          ...draftToCreateInput(draft),
          description: draft.description.trim() || null,
          language: draft.language.trim() || null,
          tags: parseTags(draft.tagsText)
        }
      })
    }
  }

  function handleEdit(): void {
    const asset = detailQuery.data
    if (!asset) return
    startEdit(draftFromAsset(asset))
    setActionError(null)
  }

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    restoreMutation.isPending

  return (
    <div className="library-layout">
      <AssetList
        assets={listQuery.data ?? []}
        selectedId={selectedId}
        loading={listQuery.isLoading}
        error={listQuery.error ? errorMessage(listQuery.error) : null}
        search={search}
        showDeleted={showDeleted}
        onSearchChange={setSearch}
        onShowDeletedChange={setShowDeleted}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onRetry={() => void listQuery.refetch()}
      />

      {mode === 'create' || mode === 'edit' ? (
        <AssetEditor
          title={mode === 'create' ? 'New Asset' : 'Edit Asset'}
          draft={draft}
          saving={createMutation.isPending || updateMutation.isPending}
          error={actionError}
          isDirty={isDirty()}
          onChange={patchDraft}
          onSave={handleSave}
          onCancel={handleCancelEditor}
        />
      ) : (
        <AssetDetail
          asset={detailQuery.data ?? null}
          loading={Boolean(selectedId) && detailQuery.isLoading}
          error={
            actionError ??
            (detailQuery.error ? errorMessage(detailQuery.error) : null)
          }
          busy={busy}
          onEdit={handleEdit}
          onFavorite={() => {
            if (!detailQuery.data) return
            updateMutation.mutate({
              id: detailQuery.data.id,
              input: { isFavorite: !detailQuery.data.isFavorite }
            })
          }}
          onDelete={() => {
            if (!detailQuery.data) return
            if (!window.confirm(`Delete “${detailQuery.data.title}”?`)) return
            deleteMutation.mutate(detailQuery.data.id)
          }}
          onRestore={() => {
            if (!detailQuery.data) return
            restoreMutation.mutate(detailQuery.data.id)
          }}
        />
      )}
    </div>
  )
}
