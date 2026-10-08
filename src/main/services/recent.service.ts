import type { RecentAsset } from '../../shared/types'
import type { Repositories } from '../database/repositories'

export class RecentService {
  constructor(private readonly repos: Repositories) {}

  list(limit?: number): RecentAsset[] {
    return this.repos.recent.list(limit)
  }

  track(assetId: string): RecentAsset {
    this.repos.assets.getByIdOrThrow(assetId)
    return this.repos.recent.track(assetId)
  }
}
