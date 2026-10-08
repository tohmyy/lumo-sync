import type { RecentAsset } from '../../../shared/types'
import { nowIso } from '../../../shared/utils'
import type { SqliteDatabase } from '../connection'
import { mapRecent, type RecentRow } from '../mappers'

export class RecentRepository {
  constructor(private readonly db: SqliteDatabase) {}

  track(assetId: string): RecentAsset {
    const now = nowIso()
    this.db
      .prepare(
        `INSERT INTO recent_assets (asset_id, opened_at, open_count)
         VALUES (?, ?, 1)
         ON CONFLICT(asset_id) DO UPDATE SET
           opened_at = excluded.opened_at,
           open_count = open_count + 1`
      )
      .run(assetId, now)

    const row = this.db
      .prepare('SELECT * FROM recent_assets WHERE asset_id = ?')
      .get(assetId) as RecentRow

    return mapRecent(row)
  }

  list(limit = 20): RecentAsset[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM recent_assets
         ORDER BY opened_at DESC
         LIMIT ?`
      )
      .all(limit) as RecentRow[]
    return rows.map(mapRecent)
  }
}
