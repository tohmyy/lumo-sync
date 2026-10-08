/// <reference types="vite/client" />

import type { LumoSyncApi } from '../preload/types/api'

declare global {
  interface Window {
    lumosync: LumoSyncApi
  }
}

export {}
