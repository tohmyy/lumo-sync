import type { JSX } from 'react'

const NAV_ITEMS = [
  { id: 'library', label: 'Library' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'recent', label: 'Recent' },
  { id: 'collections', label: 'Collections' },
  { id: 'settings', label: 'Settings' }
] as const

interface SidebarProps {
  activeId?: string
}

export function Sidebar({ activeId = 'library' }: SidebarProps): JSX.Element {
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
                disabled={item.id !== 'library'}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
