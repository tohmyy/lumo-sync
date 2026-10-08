import type { JSX } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { LibraryPage } from '../features/assets/LibraryPage'
import { CollectionsPage } from '../features/collections/CollectionsPage'
import { ConflictsPage } from '../features/sync/ConflictsPage'
import { SyncPage } from '../features/sync/SyncPage'
import { TagsPage } from '../features/tags/TagsPage'
import { useSyncEvents } from '../hooks/use-sync-events'
import { useLibraryStore } from '../stores/library-store'
import '../styles/shell.css'
import '../styles/library.css'
import '../styles/sync.css'

function viewMeta(view: string): { title: string; subtitle: string } {
  switch (view) {
    case 'favorites':
      return { title: 'Favorites', subtitle: 'Starred assets for quick access' }
    case 'recent':
      return { title: 'Recent', subtitle: 'Recently opened on this device' }
    case 'collections':
      return { title: 'Collections', subtitle: 'Organize assets into toolkits' }
    case 'collection-detail':
      return { title: 'Collection', subtitle: 'Assets in this collection' }
    case 'tags':
      return { title: 'Tags', subtitle: 'Browse and manage reusable labels' }
    case 'sync':
      return {
        title: 'Sync',
        subtitle: 'Your devices stay up to date automatically'
      }
    case 'conflicts':
      return {
        title: 'Conflicts',
        subtitle: 'Resolve concurrent edits without silent data loss'
      }
    default:
      return { title: 'Library', subtitle: 'Create, edit, and organize local assets' }
  }
}

export function App(): JSX.Element {
  useSyncEvents()
  const activeView = useLibraryStore((s) => s.activeView)
  const meta = viewMeta(activeView)

  return (
    <AppShell title={meta.title} subtitle={meta.subtitle}>
      {activeView === 'collections' || activeView === 'collection-detail' ? (
        <CollectionsPage />
      ) : activeView === 'tags' ? (
        <TagsPage />
      ) : activeView === 'sync' ? (
        <SyncPage />
      ) : activeView === 'conflicts' ? (
        <ConflictsPage />
      ) : (
        <LibraryPage />
      )}
    </AppShell>
  )
}
