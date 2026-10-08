export type DevicePlatform = 'windows' | 'macos' | 'linux'

export interface Device {
  id: string
  name: string
  platform: DevicePlatform
  appVersion: string | null
  isCurrent: boolean
  lastSeenAt: string | null
  createdAt: string
  updatedAt: string
}
