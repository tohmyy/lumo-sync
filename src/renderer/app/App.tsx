import type { JSX } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { LibraryPage } from '../features/assets/LibraryPage'
import '../styles/shell.css'
import '../styles/library.css'

export function App(): JSX.Element {
  return (
    <AppShell title="Library" subtitle="Create, edit, and organize local assets">
      <LibraryPage />
    </AppShell>
  )
}
