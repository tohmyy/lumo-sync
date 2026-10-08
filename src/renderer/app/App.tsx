import type { JSX } from 'react'
import { AppShell } from '../components/layout/AppShell'
import '../styles/shell.css'

export function App(): JSX.Element {
  return (
    <AppShell title="Library" subtitle="Phase 0 application shell">
      <p className="muted">
        LumoSync shell is ready. Local persistence and typed IPC land in Phases 1 and 2.
      </p>
    </AppShell>
  )
}
