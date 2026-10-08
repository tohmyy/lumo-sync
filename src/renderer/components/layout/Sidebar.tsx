import { useQuery } from '@tanstack/react-query'
import type { JSX } from 'react'
import { collectionsApi } from '../../lib/ipc'
import { collectionKeys } from '../../lib/query-client'
import { useLibraryStore, type AppView } from '../../stores/library-store'

const NAV_ITEMS: Array<{ id: AppView | 'settings'; label: string; enabled: boolean }> = [
  { id: 'library', label: 'Library', enabled: true },
  { id: 'favorites', label: 'Favorites', enabled: true },
  { id: 'recent', label: 'Recent', enabled: true },
  { id: 'collections', label: 'Collections', enabled: true },
  { id: 'tags', label: 'Tags', enabled: true },
  { id: 'sync', label: 'Sync', enabled: true },
  { id: 'conflicts', label: 'Conflicts', enabled: true },
  { id: 'settings', label: 'Settings', enabled: false }
]

export function Sidebar(): JSX.Element {
  const activeView = useLibraryStore((s) => s.activeView)
  const selectedCollectionId = useLibraryStore((s) => s.selectedCollectionId)
  const setView = useLibraryStore((s) => s.setView)
  const openCollection = useLibraryStore((s) => s.openCollection)

  const collectionsQuery = useQuery({
    queryKey: collectionKeys.list(),
    queryFn: () => collectionsApi.list()
  })

  const activeId =
    activeView === 'collection-detail' ? 'collections' : activeView

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">LumoSync</div>
      <nav>
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={item.id === activeId ? 'nav-item active' : 'nav-item'}
                disabled={!item.enabled}
                onClick={() => {
                  if (item.enabled && item.id !== 'settings') {
                    setView(item.id)
                  }
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {(activeView === 'collections' || activeView === 'collection-detail') &&
        collectionsQuery.data &&
        collectionsQuery.data.length > 0 ? (
          <div className="sidebar-collections">
            <p className="sidebar-section-label">Collections</p>
            <ul>
              {collectionsQuery.data.map((collection) => (
                <li key={collection.id}>
                  <button
                    type="button"
                    className={
                      selectedCollectionId === collection.id
                        ? 'nav-item nested active'
                        : 'nav-item nested'
                    }
                    onClick={() => openCollection(collection.id)}
                  >
                    <span>{collection.name}</span>
                    <span className="nav-count">{collection.assetCount}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>
    </aside>
  )
}
