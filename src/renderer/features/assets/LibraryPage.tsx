import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { AppErrorException } from '../../../shared/errors'
import type { Asset, AssetListQuery, RecentAsset } from '../../../shared/types'
import { useAssetEvents } from '../../hooks/use-asset-events'
import { useDebouncedValue } from '../../hooks/use-debounced-value'
import { assetsApi, collectionsApi, recentApi, tagsApi } from '../../lib/ipc'
import { assetKeys, collectionKeys, recentKeys, tagKeys } from '../../lib/query-client'
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

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function groupRecentLabel(openedAt: string, now = new Date()): string {
  const opened = new Date(openedAt)
  const today = startOfDay(now)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)

  if (opened >= today) return 'Today'
  if (opened >= yesterday) return 'Yesterday'
  if (opened >= weekAgo) return 'Earlier this week'
  return 'Older'
}

export function LibraryPage(): JSX.Element {
  useAssetEvents()
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)
  const [membershipIds, setMembershipIds] = useState<string[]>([])

  const {
    activeView,
    selectedId,
    selectedCollectionId,
    mode,
    showDeleted,
    searchInput,
    typeFilter,
    tagFilter,
    sortBy,
    draft,
    selectAsset,
    startCreate,
    startEdit,
    setShowDeleted,
    setSearchInput,
    setTypeFilter,
    setTagFilter,
    setSortBy,
    patchDraft,
    isDirty,
    resetEditor,
    filterByTag
  } = useLibraryStore()

  const debouncedSearch = useDebouncedValue(searchInput, 300)

  const listFilters = useMemo((): AssetListQuery => {
    const base: AssetListQuery = {
      search: debouncedSearch.trim() || undefined,
      type: typeFilter || undefined,
      tag: tagFilter || undefined,
      sortBy,
      includeDeleted: activeView === 'library' ? showDeleted : false
    }
    if (activeView === 'favorites') {
      base.isFavorite = true
    }
    if (activeView === 'collection-detail' && selectedCollectionId) {
      base.collectionId = selectedCollectionId
    }
    return base
  }, [
    debouncedSearch,
    typeFilter,
    tagFilter,
    sortBy,
    showDeleted,
    activeView,
    selectedCollectionId
  ])

  const isRecentView = activeView === 'recent'

  const listQuery = useQuery({
    queryKey: assetKeys.list(listFilters as Record<string, unknown>),
    queryFn: () => assetsApi.list(listFilters),
    enabled: !isRecentView
  })

  const recentQuery = useQuery({
    queryKey: recentKeys.list(),
    queryFn: () => recentApi.list(50),
    enabled: isRecentView
  })

  const recentAssetQueries = useQueries({
    queries: (recentQuery.data ?? []).map((item: RecentAsset) => ({
      queryKey: assetKeys.detail(item.assetId),
      queryFn: () => assetsApi.get(item.assetId),
      enabled: isRecentView
    }))
  })

  const recentAssets = useMemo(() => {
    if (!isRecentView || !recentQuery.data) return []
    const byId = new Map<string, Asset>()
    for (const result of recentAssetQueries) {
      if (result.data && !result.data.deletedAt) {
        byId.set(result.data.id, result.data)
      }
    }
    const ordered: Asset[] = []
    for (const item of recentQuery.data) {
      const asset = byId.get(item.assetId)
      if (asset) ordered.push(asset)
    }
    return ordered
  }, [isRecentView, recentQuery.data, recentAssetQueries])

  const filteredRecentAssets = useMemo(() => {
    let assets = recentAssets
    if (typeFilter) assets = assets.filter((a) => a.type === typeFilter)
    if (tagFilter) {
      const needle = tagFilter.toLowerCase()
      assets = assets.filter((a) => a.tags.some((t) => t.toLowerCase() === needle))
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      assets = assets.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          (a.description ?? '').toLowerCase().includes(q)
      )
    }
    return assets
  }, [recentAssets, typeFilter, tagFilter, debouncedSearch])

  const tagsQuery = useQuery({
    queryKey: tagKeys.list(),
    queryFn: () => tagsApi.list()
  })

  const collectionsQuery = useQuery({
    queryKey: collectionKeys.list(),
    queryFn: () => collectionsApi.list()
  })

  const collectionDetail = useMemo(() => {
    if (!selectedCollectionId || !collectionsQuery.data) return null
    return collectionsQuery.data.find((c) => c.id === selectedCollectionId) ?? null
  }, [selectedCollectionId, collectionsQuery.data])

  const detailQuery = useQuery({
    queryKey: assetKeys.detail(selectedId ?? ''),
    queryFn: () => assetsApi.get(selectedId!),
    enabled: Boolean(selectedId) && mode === 'view'
  })

  const displayedAssets = isRecentView ? filteredRecentAssets : (listQuery.data ?? [])
  const listLoading = isRecentView
    ? recentQuery.isLoading || recentAssetQueries.some((q) => q.isLoading)
    : listQuery.isLoading
  const listError = isRecentView
    ? recentQuery.error
      ? errorMessage(recentQuery.error)
      : null
    : listQuery.error
      ? errorMessage(listQuery.error)
      : null

  useEffect(() => {
    if (!selectedId || mode !== 'view') return
    void recentApi.track(selectedId).then(() => {
      void queryClient.invalidateQueries({ queryKey: recentKeys.all })
    })
  }, [selectedId, mode, queryClient])

  useEffect(() => {
    if (!selectedId || !listQuery.data) return
    if (isRecentView) return
    const stillVisible = listQuery.data.some((a) => a.id === selectedId)
    if (!stillVisible && mode === 'view') {
      selectAsset(null)
    }
  }, [listQuery.data, selectedId, mode, selectAsset, isRecentView])

  useEffect(() => {
    if (!selectedId || !collectionsQuery.data) {
      setMembershipIds([])
      return
    }
    let cancelled = false
    void Promise.all(
      collectionsQuery.data.map(async (collection) => {
        const ids = await collectionsApi.listAssets(collection.id)
        return ids.includes(selectedId) ? collection.id : null
      })
    ).then((ids) => {
      if (!cancelled) {
        setMembershipIds(ids.filter((id): id is string => Boolean(id)))
      }
    })
    return () => {
      cancelled = true
    }
  }, [selectedId, collectionsQuery.data])

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
      if (!showDeleted || activeView !== 'library') {
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

  const membershipMutation = useMutation({
    mutationFn: async ({
      collectionId,
      assetId,
      action
    }: {
      collectionId: string
      assetId: string
      action: 'add' | 'remove'
    }) => {
      if (action === 'add') await collectionsApi.addAsset(collectionId, assetId)
      else await collectionsApi.removeAsset(collectionId, assetId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      await queryClient.invalidateQueries({ queryKey: assetKeys.all })
      if (selectedId && collectionsQuery.data) {
        const ids = await Promise.all(
          collectionsQuery.data.map(async (collection) => {
            const assetIds = await collectionsApi.listAssets(collection.id)
            return assetIds.includes(selectedId) ? collection.id : null
          })
        )
        setMembershipIds(ids.filter((id): id is string => Boolean(id)))
      }
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
    restoreMutation.isPending ||
    membershipMutation.isPending

  const heading =
    activeView === 'favorites'
      ? 'Favorites'
      : activeView === 'recent'
        ? 'Recent'
        : activeView === 'collection-detail'
          ? (collectionDetail?.name ?? 'Collection')
          : 'All Assets'

  const description =
    activeView === 'favorites'
      ? 'Assets you starred for quick access.'
      : activeView === 'recent'
        ? 'Recently opened assets on this device.'
        : activeView === 'collection-detail'
          ? `${collectionDetail?.assetCount ?? 0} assets in this collection.`
          : 'Everything you’ve saved in LumoSync.'

  const emptyTitle =
    activeView === 'favorites'
      ? 'No favorites yet'
      : activeView === 'recent'
        ? 'No recent assets'
        : activeView === 'collection-detail'
          ? 'Collection is empty'
          : undefined

  const emptyDescription =
    activeView === 'favorites'
      ? 'Star assets you use often and they’ll appear here.'
      : activeView === 'recent'
        ? 'Open an asset from the Library to start your recent list.'
        : activeView === 'collection-detail'
          ? 'Add assets from the detail panel collection checkboxes.'
          : undefined

  return (
    <div className="library-layout">
      {activeView === 'collection-detail' && collectionDetail ? (
        <div className="collection-banner">
          <div>
            <p className="eyebrow">Collection</p>
            <strong>{collectionDetail.name}</strong>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const name = window.prompt('Rename collection', collectionDetail.name)
              if (!name?.trim()) return
              void collectionsApi
                .update(collectionDetail.id, { name: name.trim() })
                .then(() => queryClient.invalidateQueries({ queryKey: collectionKeys.all }))
            }}
          >
            Edit Collection
          </button>
        </div>
      ) : null}

      <div className="library-split">
        <AssetList
          heading={heading}
          description={description}
          assets={displayedAssets}
          tags={tagsQuery.data ?? []}
          selectedId={selectedId}
          loading={listLoading}
          error={listError}
          searchInput={searchInput}
          showDeleted={showDeleted}
          showDeletedToggle={activeView === 'library'}
          typeFilter={typeFilter}
          tagFilter={tagFilter}
          sortBy={sortBy}
          onSearchChange={setSearchInput}
          onShowDeletedChange={setShowDeleted}
          onTypeFilterChange={setTypeFilter}
          onTagFilterChange={setTagFilter}
          onSortByChange={setSortBy}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onRetry={() => {
            if (isRecentView) void recentQuery.refetch()
            else void listQuery.refetch()
          }}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          showCreate={activeView === 'library' || activeView === 'collection-detail'}
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
            collections={collectionsQuery.data ?? []}
            membershipIds={membershipIds}
            loading={Boolean(selectedId) && detailQuery.isLoading}
            error={
              actionError ?? (detailQuery.error ? errorMessage(detailQuery.error) : null)
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
            onTagClick={filterByTag}
            onAddToCollection={(collectionId) => {
              if (!selectedId) return
              membershipMutation.mutate({ collectionId, assetId: selectedId, action: 'add' })
            }}
            onRemoveFromCollection={(collectionId) => {
              if (!selectedId) return
              membershipMutation.mutate({ collectionId, assetId: selectedId, action: 'remove' })
            }}
          />
        )}
      </div>

      {isRecentView && filteredRecentAssets.length > 0 ? (
        <p className="recent-hint muted">
          Showing {filteredRecentAssets.length} recent ·{' '}
          {groupRecentLabel(recentQuery.data?.[0]?.openedAt ?? new Date().toISOString())} first
        </p>
      ) : null}
    </div>
  )
}
