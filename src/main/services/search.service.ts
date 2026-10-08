import type { Asset } from '../../shared/types'
import type { Repositories } from '../database/repositories'

export class SearchService {
  constructor(private readonly repos: Repositories) {}

  query(text: string, limit?: number): Asset[] {
    return this.repos.assets.search(text, limit)
  }
}
