import type { CreateTagInput, Tag, UpdateTagInput } from '../../shared/types'
import type { Repositories } from '../database/repositories'

export class TagService {
  constructor(private readonly repos: Repositories) {}

  list(): Tag[] {
    return this.repos.tags.list()
  }

  create(input: CreateTagInput): Tag {
    return this.repos.tags.create(input)
  }

  update(id: string, input: UpdateTagInput): Tag {
    return this.repos.tags.update(id, input)
  }

  delete(id: string): void {
    this.repos.tags.softDelete(id)
  }
}
