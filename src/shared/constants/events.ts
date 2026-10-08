export const AppEvents = {
  assetUpdated: 'asset.updated',
  assetDeleted: 'asset.deleted',
  syncStatusChanged: 'sync.statusChanged',
  syncConflict: 'sync.conflict',
  deviceUpdated: 'device.updated'
} as const

export type AppEventName = (typeof AppEvents)[keyof typeof AppEvents]

export const ALLOWED_EVENTS: readonly AppEventName[] = Object.values(AppEvents)
