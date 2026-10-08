import { create } from 'zustand'
import type { AssetSortBy, AssetType, CreateAssetInput } from '../../shared/types'

export type LibraryMode = 'view' | 'edit' | 'create'
export type AppView =
  | 'library'
  | 'favorites'
  | 'recent'
  | 'collections'
  | 'collection-detail'
  | 'tags'
  | 'sync'
  | 'conflicts'

export interface AssetDraft {
  type: AssetType
  title: string
  description: string
  language: string
  content: string
  isFavorite: boolean
  tagsText: string
}

export function emptyDraft(): AssetDraft {
  return {
    type: 'snippet',
    title: '',
    description: '',
    language: 'typescript',
    content: '',
    isFavorite: false,
    tagsText: ''
  }
}

export function draftFromAsset(asset: {
  type: AssetType
  title: string
  description: string | null
  language: string | null
  content: string
  isFavorite: boolean
  tags: string[]
}): AssetDraft {
  return {
    type: asset.type,
    title: asset.title,
    description: asset.description ?? '',
    language: asset.language ?? '',
    content: asset.content,
    isFavorite: asset.isFavorite,
    tagsText: asset.tags.join(', ')
  }
}

export function draftToCreateInput(draft: AssetDraft): CreateAssetInput {
  return {
    type: draft.type,
    title: draft.title.trim(),
    description: draft.description.trim() || undefined,
    language: draft.language.trim() || undefined,
    content: draft.content,
    isFavorite: draft.isFavorite,
    tags: parseTags(draft.tagsText)
  }
}

export function parseTags(tagsText: string): string[] {
  return tagsText
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

interface LibraryState {
  activeView: AppView
  selectedId: string | null
  selectedCollectionId: string | null
  mode: LibraryMode
  showDeleted: boolean
  searchInput: string
  typeFilter: AssetType | ''
  tagFilter: string
  sortBy: AssetSortBy
  draft: AssetDraft
  draftBaseline: AssetDraft | null
  setView: (view: AppView) => void
  openCollection: (id: string) => void
  selectAsset: (id: string | null) => void
  startCreate: () => void
  startEdit: (draft: AssetDraft) => void
  setMode: (mode: LibraryMode) => void
  setShowDeleted: (value: boolean) => void
  setSearchInput: (value: string) => void
  setTypeFilter: (value: AssetType | '') => void
  setTagFilter: (value: string) => void
  setSortBy: (value: AssetSortBy) => void
  setDraft: (draft: AssetDraft) => void
  patchDraft: (patch: Partial<AssetDraft>) => void
  isDirty: () => boolean
  resetEditor: () => void
  filterByTag: (tag: string) => void
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  activeView: 'library',
  selectedId: null,
  selectedCollectionId: null,
  mode: 'view',
  showDeleted: false,
  searchInput: '',
  typeFilter: '',
  tagFilter: '',
  sortBy: 'updated',
  draft: emptyDraft(),
  draftBaseline: null,

  setView: (activeView) =>
    set({
      activeView,
      selectedCollectionId: activeView === 'collection-detail' ? get().selectedCollectionId : null,
      selectedId: null,
      mode: 'view',
      draft: emptyDraft(),
      draftBaseline: null,
      showDeleted: activeView === 'library' ? get().showDeleted : false
    }),

  openCollection: (id) =>
    set({
      activeView: 'collection-detail',
      selectedCollectionId: id,
      selectedId: null,
      mode: 'view',
      draft: emptyDraft(),
      draftBaseline: null
    }),

  selectAsset: (id) =>
    set({
      selectedId: id,
      mode: 'view',
      draft: emptyDraft(),
      draftBaseline: null
    }),

  startCreate: () => {
    const draft = emptyDraft()
    set({
      mode: 'create',
      selectedId: null,
      draft,
      draftBaseline: draft
    })
  },

  startEdit: (draft) =>
    set({
      mode: 'edit',
      draft,
      draftBaseline: draft
    }),

  setMode: (mode) => set({ mode }),
  setShowDeleted: (showDeleted) => set({ showDeleted }),
  setSearchInput: (searchInput) => set({ searchInput }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setTagFilter: (tagFilter) => set({ tagFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
  setDraft: (draft) => set({ draft }),
  patchDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),

  isDirty: () => {
    const { draft, draftBaseline, mode } = get()
    if (mode !== 'edit' && mode !== 'create') return false
    if (!draftBaseline) return false
    return JSON.stringify(draft) !== JSON.stringify(draftBaseline)
  },

  resetEditor: () =>
    set({
      mode: 'view',
      draft: emptyDraft(),
      draftBaseline: null
    }),

  filterByTag: (tag) =>
    set({
      activeView: 'library',
      tagFilter: tag,
      selectedCollectionId: null,
      selectedId: null,
      mode: 'view'
    })
}))
