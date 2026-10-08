import type { Setting, SettingsMap } from '../../shared/types'
import type { Repositories } from '../database/repositories'

export class SettingsService {
  constructor(private readonly repos: Repositories) {}

  get(key: string): string | null {
    return this.repos.settings.get(key)
  }

  getAll(): SettingsMap {
    return this.repos.settings.getAll()
  }

  update(key: string, value: string): Setting {
    return this.repos.settings.set(key, value)
  }
}
