import { create } from 'zustand'
import type { AssetType, CreateAssetInput } from '../../shared/types'

export type LibraryMode = 'view' | 'edit' | 'create'

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
  selectedId: string | null
  mode: LibraryMode
  showDeleted: boolean
  search: string
  draft: AssetDraft
  draftBaseline: AssetDraft | null
  selectAsset: (id: string | null) => void
  startCreate: () => void
  startEdit: (draft: AssetDraft) => void
  setMode: (mode: LibraryMode) => void
  setShowDeleted: (value: boolean) => void
  setSearch: (value: string) => void
  setDraft: (draft: AssetDraft) => void
  patchDraft: (patch: Partial<AssetDraft>) => void
  isDirty: () => boolean
  resetEditor: () => void
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  selectedId: null,
  mode: 'view',
  showDeleted: false,
  search: '',
  draft: emptyDraft(),
  draftBaseline: null,

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
  setSearch: (search) => set({ search }),
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
    })
}))
