export interface Setting {
  key: string
  value: string
  updatedAt: string
}

export type SettingsMap = Record<string, string>
