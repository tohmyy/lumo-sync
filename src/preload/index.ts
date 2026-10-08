import { contextBridge } from 'electron'

/**
 * Phase 0 preload bridge.
 * Exposes a minimal namespace; typed IPC API arrives in Phase 2.
 */
contextBridge.exposeInMainWorld('lumosync', {
  ready: true
})
