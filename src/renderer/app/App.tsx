import type { JSX } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { DebugPanel } from './DebugPanel'
import '../styles/shell.css'
import '../styles/debug.css'

export function App(): JSX.Element {
  return (
    <AppShell title="Library" subtitle="Phase 0–2 foundation ready">
      <DebugPanel />
    </AppShell>
  )
}
