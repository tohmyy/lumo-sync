import type { JSX, ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function AppShell({
  children,
  title = 'Library',
  subtitle = 'Local-first asset workspace'
}: AppShellProps): JSX.Element {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header title={title} subtitle={subtitle} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}
