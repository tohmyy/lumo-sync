# LumoSync — Database Specification

**Document:** `DATABASE-SPEC.md`
**Status:** MVP / Demo Ready
**Database:** SQLite
**Application:** LumoSync Desktop
**Primary Runtime:** Electron + React + TypeScript
**Persistence Model:** Local-first

---

## 1. Purpose

This document defines the SQLite data model, persistence rules, relationships, indexes, constraints, and migration requirements for LumoSync.

The database is the primary local persistence layer for the desktop application.

LumoSync follows a **local-first** model:

> User actions are persisted locally first, reflected immediately in the UI, and synchronized with other devices asynchronously.

The database therefore must support:

* Immediate local writes
* Offline operation
* Asset storage
* Collections
* Tags
* Favorites
* Recent activity
* Device identity
* Sync queues
* Sync state
* Conflict detection
* Soft deletion / tombstones
* Search
* Future multi-device synchronization

This specification defines the **local database only**. A future cloud synchronization service may maintain a separate server-side schema.

---

# 2. Design Principles

## 2.1 Local database is the immediate source of truth

The UI must never wait for network synchronization before displaying a successful local operation.

Example:

```text
User edits snippet
       ↓
SQLite transaction
       ↓
UI updates immediately
       ↓
Sync operation queued
       ↓
Background synchronization
```

---

## 2.2 Offline must be a normal operating state

The database must remain fully usable when:

* Internet access is unavailable
* The sync service is unavailable
* Another device cannot be reached
* Authentication temporarily fails

No core asset-management operation should require an active network connection.

---

## 2.3 Prefer stable IDs over database-generated numeric IDs

Application entities use UUID-style identifiers.

Recommended representation:

```text
TEXT
```

Example:

```text
6e4b0ab8-1a3b-4f4a-9eb9-6a0b6c1b7c72
```

This allows IDs to be generated independently on different devices without relying on a central sequence.

---

## 2.4 Deletions are logical

Synchronizable records must not normally be physically deleted immediately.

Instead:

```text
deleted_at = timestamp
```

is used as a tombstone.

This is required so another device can learn that the record was deleted.

---

## 2.5 UTC timestamps

All persisted timestamps must use UTC.

Recommended format:

```text
YYYY-MM-DDTHH:mm:ss.sssZ
```

Example:

```text
2026-10-08T14:32:19.482Z
```

SQLite storage type:

```text
TEXT
```

---

## 2.6 Database writes must be transactional

Operations affecting multiple tables must execute inside a transaction.

Example:

Creating an asset with tags:

```text
BEGIN TRANSACTION

insert asset
insert asset_tags
insert sync_operation
update search index

COMMIT
```

The application must avoid partially persisted asset operations.

---

# 3. Database Responsibilities

The SQLite database is responsible for:

| Responsibility         | Database |
| ---------------------- | -------- |
| Asset persistence      | ✅        |
| Collections            | ✅        |
| Tags                   | ✅        |
| Favorites              | ✅        |
| Recent asset metadata  | ✅        |
| Search index           | ✅        |
| Device identity        | ✅        |
| Sync queue             | ✅        |
| Sync state             | ✅        |
| Conflict records       | ✅        |
| Application settings   | ✅        |
| Authentication secrets | ❌        |
| Encryption keys        | ❌        |
| Remote API credentials | ❌        |

Sensitive credentials and secrets must be stored using the operating system's secure credential/keychain facility rather than plaintext SQLite storage.

---

# 4. Database File

## 4.1 Development

The database location may be configurable during development.

Example:

```text
./data/lumosync.db
```

## 4.2 Production

The database must be stored in Electron's application data directory.

Conceptually:

```text
app.getPath("userData")/
    database/
        lumosync.db
```

Recommended structure:

```text
database/
├── lumosync.db
├── lumosync.db-wal
└── lumosync.db-shm
```

SQLite WAL mode is recommended for normal application operation.

---

# 5. SQLite Configuration

The database connection should initialize with the following settings:

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
```

The exact production configuration may evolve after performance testing.

## 5.1 Why WAL

Write-Ahead Logging provides better concurrency between:

* renderer-triggered reads
* background synchronization
* application writes

The application should still serialize database mutations through the main-process data layer where practical.

---

# 6. Core Entities

The MVP database contains the following core entities:

```text
app_metadata
devices
assets
asset_revisions
collections
collection_assets
tags
asset_tags
recent_assets
sync_operations
sync_state
sync_conflicts
settings
```

Search is implemented using:

```text
asset_search
```

as an SQLite FTS5 virtual table.

---

# 7. Entity Relationship Overview

```text
                         ┌──────────────┐
                         │   devices    │
                         └──────┬───────┘
                                │
                                │
                         ┌──────▼───────┐
                         │asset_revisions│
                         └──────▲───────┘
                                │
                         ┌──────┴───────┐
                         │    assets    │
                         └──┬────────┬──┘
                            │        │
                ┌───────────┘        └───────────────┐
                │                                    │
         ┌──────▼───────┐                     ┌──────▼──────┐
         │  asset_tags  │                     │recent_assets│
         └──────┬───────┘                     └─────────────┘
                │
         ┌──────▼───────┐
         │     tags     │
         └──────────────┘

         ┌───────────────┐
         │  collections  │
         └───────┬───────┘
                 │
         ┌───────▼──────────┐
         │collection_assets │
         └────────┬─────────┘
                  │
                  ▼
                assets


assets ───────────────► sync_operations
assets ───────────────► sync_conflicts
collections ──────────► sync_operations
tags ─────────────────► sync_operations

                ┌────────────┐
                │ sync_state │
                └────────────┘
```

---

# 8. `app_metadata`

Stores database/application-level metadata.

## Schema

```sql
CREATE TABLE app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

## Intended values

Examples:

```text
schema_version
database_created_at
installation_id
last_migration
```

Example:

```text
schema_version = 1
```

Only application-level metadata should be stored here.

---

# 9. `devices`

Represents devices participating in synchronization.

## Schema

```sql
CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    app_version TEXT,
    is_current INTEGER NOT NULL DEFAULT 0,
    last_seen_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

## Fields

| Field          | Type    | Rules                       |
| -------------- | ------- | --------------------------- |
| `id`           | TEXT    | UUID, PK                    |
| `name`         | TEXT    | Required                    |
| `platform`     | TEXT    | `windows`, `macos`, `linux` |
| `app_version`  | TEXT    | Nullable                    |
| `is_current`   | INTEGER | Boolean                     |
| `last_seen_at` | TEXT    | Nullable                    |
| `created_at`   | TEXT    | Required                    |
| `updated_at`   | TEXT    | Required                    |

Exactly one local device should normally have:

```text
is_current = 1
```

The current device ID is generated during first launch and persisted.

---

# 10. `assets`

The asset table is the primary entity in LumoSync.

An asset may represent:

* Code snippet
* Command
* Configuration
* Note
* Template

## Schema

```sql
CREATE TABLE assets (
    id TEXT PRIMARY KEY,

    type TEXT NOT NULL,
    title TEXT NOT NULL,

    description TEXT,
    language TEXT,

    content TEXT NOT NULL,

    is_favorite INTEGER NOT NULL DEFAULT 0,

    version INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    deleted_at TEXT,

    created_by_device_id TEXT,
    updated_by_device_id TEXT,

    FOREIGN KEY (created_by_device_id)
        REFERENCES devices(id),

    FOREIGN KEY (updated_by_device_id)
        REFERENCES devices(id)
);
```

---

# 11. Asset Types

MVP-supported asset types:

```text
snippet
command
config
note
template
```

The database may initially enforce the allowed values at the application layer.

Example:

```typescript
type AssetType =
  | "snippet"
  | "command"
  | "config"
  | "note"
  | "template";
```

A database-level `CHECK` constraint can be introduced once the list becomes stable.

---

# 12. Asset Fields

### `id`

Globally unique asset identifier.

Example:

```text
b43b5cb8-2b3d-4e22-97bb-d5d49a57e6b3
```

---

### `type`

Determines the general type of stored asset.

---

### `title`

Human-readable name.

Must not be empty.

---

### `description`

Optional explanation of the asset.

---

### `language`

Optional programming language identifier.

Examples:

```text
typescript
javascript
java
python
sql
bash
json
yaml
```

Non-code assets may leave this field `NULL`.

---

### `content`

Primary asset body.

Examples:

```text
const result = await fetch(...)
```

or:

```text
npm run build
```

---

### `is_favorite`

Boolean represented as:

```text
0 = false
1 = true
```

---

### `version`

Logical asset version.

Every successful mutation that changes syncable asset content must increment the version.

Example:

```text
version 1
→ update
version 2
→ update
version 3
```

---

### `deleted_at`

`NULL` means active.

A timestamp indicates logical deletion.

Deleted assets should normally remain available to the synchronization engine.

---

# 13. Asset Indexes

```sql
CREATE INDEX idx_assets_updated_at
ON assets(updated_at);

CREATE INDEX idx_assets_type
ON assets(type);

CREATE INDEX idx_assets_favorite
ON assets(is_favorite);

CREATE INDEX idx_assets_deleted_at
ON assets(deleted_at);

CREATE INDEX idx_assets_updated_by_device
ON assets(updated_by_device_id);
```

---

# 14. `asset_revisions`

Stores revision snapshots used for sync, auditing, and conflict resolution.

## Schema

```sql
CREATE TABLE asset_revisions (
    id TEXT PRIMARY KEY,

    asset_id TEXT NOT NULL,

    version INTEGER NOT NULL,

    operation TEXT NOT NULL,

    title TEXT NOT NULL,
    description TEXT,
    language TEXT,
    content TEXT NOT NULL,

    is_favorite INTEGER NOT NULL,

    created_at TEXT NOT NULL,
    device_id TEXT NOT NULL,

    FOREIGN KEY (asset_id)
        REFERENCES assets(id),

    FOREIGN KEY (device_id)
        REFERENCES devices(id),

    UNIQUE(asset_id, version)
);
```

## Operation values

```text
create
update
delete
restore
```

A revision represents the state of an asset at a specific version.

---

# 15. Revision Retention

The MVP may retain all revisions during development.

For a production implementation, historical revisions may eventually be pruned.

Recommended future policy:

```text
Keep latest 20 revisions per asset
```

with an option to preserve conflict-related revisions.

Revision pruning must never remove information required by the synchronization engine.

---

# 16. `collections`

Collections allow users to organize assets.

## Schema

```sql
CREATE TABLE collections (
    id TEXT PRIMARY KEY,

    name TEXT NOT NULL,
    description TEXT,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    deleted_at TEXT,

    created_by_device_id TEXT,
    updated_by_device_id TEXT,

    FOREIGN KEY (created_by_device_id)
        REFERENCES devices(id),

    FOREIGN KEY (updated_by_device_id)
        REFERENCES devices(id)
);
```

Collections are intentionally flat for the MVP.

Nested collections are not required for the first demo.

---

# 17. Collection Constraints

Collection names should be unique among active collections.

SQLite cannot conveniently enforce this with a normal unique constraint while allowing tombstones, so the application must enforce:

```text
No two active collections may have the same normalized name.
```

Recommended normalization:

```text
trim
lowercase
```

Example:

```text
"Frontend"
" frontend "
"FRONTEND"
```

should be considered duplicates.

---

# 18. `collection_assets`

Many-to-many relationship between assets and collections.

## Schema

```sql
CREATE TABLE collection_assets (
    collection_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,

    created_at TEXT NOT NULL,

    PRIMARY KEY (collection_id, asset_id),

    FOREIGN KEY (collection_id)
        REFERENCES collections(id),

    FOREIGN KEY (asset_id)
        REFERENCES assets(id)
);
```

An asset may belong to multiple collections.

A collection may contain many assets.

---

# 19. Collection Indexes

```sql
CREATE INDEX idx_collection_assets_asset
ON collection_assets(asset_id);

CREATE INDEX idx_collection_assets_collection
ON collection_assets(collection_id);
```

---

# 20. `tags`

Stores reusable user-defined tags.

## Schema

```sql
CREATE TABLE tags (
    id TEXT PRIMARY KEY,

    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    deleted_at TEXT
);
```

## Constraints

Active tags must have a unique normalized name.

Example:

```text
"name": "React"
"normalized_name": "react"
```

Recommended unique index:

```sql
CREATE UNIQUE INDEX idx_tags_normalized_name_active
ON tags(normalized_name)
WHERE deleted_at IS NULL;
```

---

# 21. `asset_tags`

Many-to-many asset/tag relationship.

## Schema

```sql
CREATE TABLE asset_tags (
    asset_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,

    created_at TEXT NOT NULL,

    PRIMARY KEY (asset_id, tag_id),

    FOREIGN KEY (asset_id)
        REFERENCES assets(id),

    FOREIGN KEY (tag_id)
        REFERENCES tags(id)
);
```

Indexes:

```sql
CREATE INDEX idx_asset_tags_tag
ON asset_tags(tag_id);

CREATE INDEX idx_asset_tags_asset
ON asset_tags(asset_id);
```

---

# 22. `recent_assets`

Stores lightweight recent-use information.

This should not duplicate complete asset data.

## Schema

```sql
CREATE TABLE recent_assets (
    asset_id TEXT PRIMARY KEY,

    opened_at TEXT NOT NULL,

    open_count INTEGER NOT NULL DEFAULT 1,

    FOREIGN KEY (asset_id)
        REFERENCES assets(id)
);
```

When an asset is opened:

```text
upsert recent_assets
```

The UI can use:

```text
ORDER BY opened_at DESC
```

to display recent assets.

Recent activity is local UX metadata and does not need to synchronize between devices for the MVP.

---

# 23. Favorites

Favorites are represented directly on `assets`:

```text
assets.is_favorite
```

A separate favorites table is unnecessary for the MVP.

This simplifies:

* queries
* rendering
* IPC operations
* synchronization

Favorite state is considered syncable asset metadata.

---

# 24. Full-Text Search

LumoSync should use SQLite FTS5 for local search.

## Search table

```sql
CREATE VIRTUAL TABLE asset_search
USING fts5(
    asset_id UNINDEXED,
    title,
    description,
    content,
    language
);
```

The application must maintain the FTS index whenever an asset is:

* created
* updated
* restored
* deleted

Deleted assets should either be removed from active search or excluded from queries.

---

# 25. Search Query Behavior

Search should support matching across:

```text
title
description
content
language
```

Tags may be filtered using relational queries rather than included directly in FTS.

Example:

```sql
SELECT a.*
FROM assets a
JOIN asset_search s
    ON s.asset_id = a.id
WHERE s MATCH ?
  AND a.deleted_at IS NULL;
```

Search implementation must support:

* partial user input
* phrase matching
* ranking
* filtering by asset type
* filtering by collection
* filtering by favorite
* filtering by tag

---

# 26. `sync_operations`

Stores local changes waiting to synchronize.

This is one of the most important tables for the local-first architecture.

## Schema

```sql
CREATE TABLE sync_operations (
    id TEXT PRIMARY KEY,

    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,

    operation TEXT NOT NULL,

    base_version INTEGER,
    target_version INTEGER,

    payload TEXT NOT NULL,

    created_at TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending',

    attempt_count INTEGER NOT NULL DEFAULT 0,

    last_attempt_at TEXT,
    last_error TEXT
);
```

---

# 27. Sync Operation Types

### `entity_type`

MVP:

```text
asset
collection
tag
collection_asset
asset_tag
```

### `operation`

```text
create
update
delete
```

---

# 28. Sync Status

Allowed statuses:

```text
pending
processing
completed
failed
blocked
```

Normal lifecycle:

```text
pending
   ↓
processing
   ↓
completed
```

Failure:

```text
processing
   ↓
failed
   ↓
pending
```

Conflict:

```text
processing
   ↓
blocked
```

A blocked operation normally requires user resolution.

---

# 29. Sync Operation Payload

`payload` stores a JSON snapshot needed to reproduce the operation.

Example:

```json
{
  "id": "asset-123",
  "type": "snippet",
  "title": "Fetch API Example",
  "description": "Basic authenticated request",
  "language": "typescript",
  "content": "const response = await fetch(...)",
  "is_favorite": true,
  "version": 4
}
```

Payloads must contain enough information for the synchronization layer to process the operation without depending on mutable UI state.

---

# 30. Sync Operation Indexes

```sql
CREATE INDEX idx_sync_operations_status
ON sync_operations(status);

CREATE INDEX idx_sync_operations_entity
ON sync_operations(entity_type, entity_id);

CREATE INDEX idx_sync_operations_created
ON sync_operations(created_at);
```

The synchronization engine should normally process pending operations in creation order.

---

# 31. `sync_state`

Stores the last known synchronization state.

## Schema

```sql
CREATE TABLE sync_state (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

Example values:

```text
last_pull_cursor
last_successful_sync_at
last_sync_attempt_at
last_sync_error
sync_status
server_device_id
```

A key-value approach is appropriate here because synchronization metadata will likely evolve.

---

# 32. Sync Status Values

Application-level sync state:

```text
idle
syncing
synced
pending
offline
error
conflict
```

These values correspond to UI status indicators.

Example:

```text
sync_status = "syncing"
```

---

# 33. `sync_conflicts`

Stores unresolved synchronization conflicts.

## Schema

```sql
CREATE TABLE sync_conflicts (
    id TEXT PRIMARY KEY,

    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,

    local_version INTEGER,
    remote_version INTEGER,

    local_payload TEXT NOT NULL,
    remote_payload TEXT NOT NULL,

    detected_at TEXT NOT NULL,

    resolution TEXT,

    resolved_at TEXT,
    resolved_by_device_id TEXT,

    FOREIGN KEY (resolved_by_device_id)
        REFERENCES devices(id)
);
```

---

# 34. Conflict Resolution Values

Possible values:

```text
keep_local
keep_remote
merged
discard_local
discard_remote
```

For the first demo, the UI may initially support:

```text
Keep Local
Keep Remote
```

Manual merging can be added afterward.

---

# 35. `settings`

Stores local application preferences.

## Schema

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,

    updated_at TEXT NOT NULL
);
```

Examples:

```text
theme
editor_font_size
editor_word_wrap
sidebar_collapsed
default_asset_type
startup_view
confirm_delete
show_sync_details
```

Settings should not contain credentials or encryption keys.

---

# 36. What Should Not Be Stored in SQLite

The following must not be stored as ordinary plaintext SQLite values:

```text
access tokens
refresh tokens
API secrets
encryption master keys
passwords
private authentication credentials
```

Instead use:

```text
Electron / OS secure credential storage
```

Examples include:

* Windows Credential Manager
* macOS Keychain
* Linux Secret Service / Keyring

The exact implementation belongs in the future Security Specification.

---

# 37. Referential Integrity

Foreign keys must be enabled:

```sql
PRAGMA foreign_keys = ON;
```

Relationships must maintain referential integrity.

For example:

```text
asset_tags.asset_id
        ↓
assets.id
```

and:

```text
asset_tags.tag_id
        ↓
tags.id
```

---

# 38. Delete Behavior

Because synchronizable entities use tombstones, destructive cascade deletion should be minimized.

Recommended behavior:

### Asset deleted

```text
assets.deleted_at = timestamp
```

Related:

```text
asset_tags
collection_assets
```

may remain temporarily for synchronization purposes or be cleaned by a controlled maintenance process.

### Tag deleted

A tag becomes a tombstone.

Existing relationships can remain until synchronization cleanup.

### Collection deleted

Collection becomes a tombstone.

Membership rows should not be used to infer that assets themselves were deleted.

---

# 39. Transactions

The application must treat compound user actions as transactions.

## Example: Create asset

```sql
BEGIN;

INSERT INTO assets (...);

INSERT INTO asset_revisions (...);

INSERT INTO asset_tags (...);

INSERT INTO sync_operations (...);

COMMIT;
```

## Example: Update asset

```sql
BEGIN;

UPDATE assets
SET
    title = ?,
    content = ?,
    version = version + 1,
    updated_at = ?
WHERE id = ?;

INSERT INTO asset_revisions (...);

INSERT INTO sync_operations (...);

UPDATE asset_search ...;

COMMIT;
```

---

# 40. Versioning Rules

An asset version changes when syncable data changes.

Examples:

| Change                | Increment version? |
| --------------------- | -----------------: |
| Title                 |                  ✅ |
| Description           |                  ✅ |
| Content               |                  ✅ |
| Language              |                  ✅ |
| Favorite              |                  ✅ |
| Tags                  |                  ✅ |
| Collection membership |    ❌ asset version |
| Local open time       |                  ❌ |
| Local UI preference   |                  ❌ |

Collection and tag relationship changes create their own sync operations.

---

# 41. Local Metadata vs Syncable Data

Not all local database values need to synchronize.

## Syncable

```text
asset
collection
tag
asset-tag membership
collection membership
favorite state
asset deletion
asset metadata
asset content
```

## Local-only

```text
recent_assets
UI preferences
window dimensions
sidebar state
local search state
last opened screen
```

This distinction is important to prevent unnecessary synchronization traffic.

---

# 42. Idempotency

Synchronization operations must be safe to process more than once.

Every operation has a globally unique:

```text
sync_operations.id
```

The sync system should use this ID as an idempotency key.

A repeated operation must not create duplicate records or apply the same mutation twice.

---

# 43. Concurrency Rules

SQLite writes should be coordinated through the application's data-access layer.

Recommended architecture:

```text
React Renderer
      ↓
Preload IPC API
      ↓
Electron Main
      ↓
Repository / Database Service
      ↓
SQLite
```

The renderer must not directly open the SQLite database.

---

# 44. Database Access Layer

Recommended structure:

```text
src/
├── main/
│   ├── database/
│   │   ├── connection
│   │   ├── migrations
│   │   ├── repositories
│   │   └── queries
│   │
│   └── sync/
│
├── preload/
└── renderer/
```

Repositories should encapsulate database operations.

Example:

```typescript
interface AssetRepository {
  create(input: CreateAssetInput): Promise<Asset>;
  getById(id: string): Promise<Asset | null>;
  list(query: AssetListQuery): Promise<Asset[]>;
  update(id: string, input: UpdateAssetInput): Promise<Asset>;
  delete(id: string): Promise<void>;
  restore(id: string): Promise<Asset>;
}
```

The renderer should consume application-level APIs rather than raw SQL.

---

# 45. Migration Strategy

Database schema changes must use versioned migrations.

Example:

```text
migrations/
├── 001_initial_schema.sql
├── 002_add_asset_revisions.sql
├── 003_add_search_index.sql
└── 004_add_sync_conflicts.sql
```

The application must:

1. Detect current database schema version.
2. Determine pending migrations.
3. Execute migrations in order.
4. Update schema version.
5. Fail startup if a migration cannot be safely completed.

Migrations must be transactional whenever SQLite permits it.

---

# 46. MVP Initial Schema

The first migration should establish:

```text
app_metadata
devices
assets
asset_revisions
collections
collection_assets
tags
asset_tags
recent_assets
sync_operations
sync_state
sync_conflicts
settings
asset_search
```

This gives the application enough structure to support the demo without requiring future schema redesign.

---

# 47. Demo Scope

The first demo should actively use only the following database capabilities:

### Required

```text
assets
collections
tags
asset_tags
recent_assets
settings
asset_search
devices
```

### Required when sync is demonstrated

```text
asset_revisions
sync_operations
sync_state
sync_conflicts
```

### Can remain minimally implemented initially

```text
revision retention
advanced conflict merging
remote device lifecycle management
database maintenance
automated tombstone cleanup
```

---

# 48. Example Asset Lifecycle

## Create

```text
User clicks "New Asset"
        ↓
generate UUID
        ↓
INSERT assets
        ↓
INSERT revision
        ↓
INSERT sync operation
        ↓
update FTS index
        ↓
commit
```

## Edit

```text
User edits content
        ↓
save locally
        ↓
increment version
        ↓
create revision
        ↓
queue sync operation
        ↓
update search index
```

## Delete

```text
User deletes asset
        ↓
set deleted_at
        ↓
increment version
        ↓
create delete revision
        ↓
queue delete operation
        ↓
remove from normal UI queries
```

## Restore

```text
User restores asset
        ↓
clear deleted_at
        ↓
increment version
        ↓
create restore revision
        ↓
queue update operation
```

---

# 49. Query Rules

Normal asset queries must exclude tombstones:

```sql
WHERE deleted_at IS NULL
```

unless the query explicitly requests deleted records.

Example:

```sql
SELECT *
FROM assets
WHERE deleted_at IS NULL
ORDER BY updated_at DESC;
```

---

# 50. Sorting

Default library sorting:

```text
updated_at DESC
```

Supported sort options:

```text
Recently Updated
Recently Created
Alphabetical
Recently Opened
```

These can be implemented using:

```text
assets.updated_at
assets.created_at
assets.title
recent_assets.opened_at
```

---

# 51. Filtering

The database layer should support combinations of:

```text
asset type
favorite
collection
tag
language
deleted state
search query
```

Filters should be composable rather than implemented as separate hard-coded queries.

Example:

```typescript
interface AssetListQuery {
  search?: string;
  type?: AssetType;
  collectionId?: string;
  tagId?: string;
  favorite?: boolean;
  sort?: AssetSort;
}
```

---

# 52. Data Validation

Validation must happen before database writes.

Examples:

### Asset title

```text
required
trimmed
minimum length: 1
```

### Asset type

Must be one of the supported types.

### Content

Must be a string.

### Tag

```text
trim
normalize
minimum length: 1
```

### Collection

```text
trim
normalize
minimum length: 1
```

The database remains the final integrity boundary, but application validation should provide user-friendly errors.

---

# 53. Database Error Handling

Database failures should be translated into application-level errors.

Avoid exposing raw SQLite errors directly to the renderer.

Example:

```typescript
throw new DatabaseError(
  "ASSET_CREATE_FAILED",
  "Unable to save the asset."
);
```

Errors should preserve the original database error internally for logging.

---

# 54. Performance Requirements

For the MVP, the local database should support:

```text
10,000+ assets
100,000+ revisions
10,000+ tags
1,000+ collections
```

without noticeable UI degradation for ordinary queries.

Search should remain responsive at typical user dataset sizes.

Long-running database work must not block the renderer.

---

# 55. Backup Considerations

The SQLite file represents the user's local application state.

Future backup mechanisms may include:

```text
database snapshot
export/import
cloud synchronization
```

However, the MVP does not require a dedicated backup system.

If database backup is later implemented, WAL consistency must be considered.

---

# 56. Data Integrity Rules

The following invariants must always hold:

1. Every active asset has a unique ID.
2. Every asset has a valid type.
3. Every asset has a non-empty title.
4. Asset version is always greater than or equal to `1`.
5. Asset timestamps are valid UTC timestamps.
6. An asset may belong to zero or more collections.
7. An asset may have zero or more tags.
8. A collection may contain zero or more assets.
9. A tag may belong to zero or more assets.
10. Deleted syncable records retain tombstones until synchronization no longer requires them.
11. Every sync operation references a valid entity.
12. Every conflict references a valid entity.
13. Every asset revision belongs to exactly one asset.
14. `(asset_id, version)` is unique.
15. IDs are generated client-side and are globally unique.

---

# 57. Example Seed Data

Development builds may create sample content.

Example:

```text
Collection:
Frontend

Tags:
react
typescript
api
docker

Assets:

1. Fetch API Example
   type: snippet
   language: typescript

2. Docker Cleanup
   type: command
   language: bash

3. Spring Boot JWT Configuration
   type: config
   language: java
```

Production builds must not automatically create demo assets unless explicitly requested by onboarding.

---

# 58. Database Testing Requirements

The database layer must test:

### CRUD

```text
create asset
read asset
update asset
delete asset
restore asset
```

### Relationships

```text
asset ↔ tags
asset ↔ collections
```

### Search

```text
title search
content search
language search
combined filtering
```

### Versioning

```text
update increments version
revision created
```

### Soft deletion

```text
deleted asset excluded from normal queries
restore returns asset
```

### Sync queue

```text
mutation creates sync operation
operation contains correct version
operation can be retried
```

### Conflict

```text
conflict can be created
conflict can be resolved
resolution state persists
```

---

# 59. Acceptance Criteria

The database implementation is considered complete for MVP when:

* [ ] Application can create, read, update, delete, and restore assets.
* [ ] Assets persist across application restarts.
* [ ] Collections persist correctly.
* [ ] Tags persist correctly.
* [ ] Assets can belong to multiple collections.
* [ ] Assets can have multiple tags.
* [ ] Favorites persist.
* [ ] Recent assets persist.
* [ ] Local search works without network access.
* [ ] Database uses WAL mode.
* [ ] Foreign keys are enabled.
* [ ] Schema migrations execute automatically.
* [ ] Assets have stable UUID identifiers.
* [ ] Asset mutations create revisions.
* [ ] Asset mutations create sync operations.
* [ ] Deletes are represented as tombstones.
* [ ] Sync state persists across application restarts.
* [ ] Conflicts can be stored without losing either version.
* [ ] Renderer code never directly accesses SQLite.
* [ ] Database failures are translated into application errors.
* [ ] Core database operations execute inside transactions where appropriate.

---

# 60. Recommended MVP Implementation Priority

Implementation should proceed in this order:

```text
1. Database connection
2. Migration system
3. assets
4. collections
5. tags
6. asset_tags
7. collection_assets
8. recent_assets
9. settings
10. FTS search
11. devices
12. asset_revisions
13. sync_operations
14. sync_state
15. sync_conflicts
```

For the first UI demo, the application can reach a useful milestone after step 10.

Synchronization-specific tables can then be activated as the sync engine is implemented.

---

# 61. Non-Goals

The following are explicitly outside the initial database implementation:

* Multi-user permission models
* Team/workspace databases
* Nested collections
* Complex asset branching
* Real-time collaborative editing
* Server-side relational schema
* Analytics/event warehouse
* Usage telemetry storage
* Encrypted database implementation
* Automatic cloud backup
* Advanced revision browsing
* Three-way merge storage
* Distributed transaction coordination

These may be addressed in later specifications.

---

# 62. Future Evolution

The schema is intentionally designed so the following capabilities can be added without fundamentally replacing the asset model:

```text
Cloud synchronization
Multiple accounts
Shared workspaces
Team collections
Asset permissions
Advanced revision history
Three-way merge
Conflict preview
Cloud backups
Versioned asset publishing
Asset import/export
Plugin ecosystem
```

The most important architectural constraint is that local asset IDs remain globally stable.

---

# 63. Summary

The LumoSync local database is built around a simple principle:

> **Persist the user's work locally first, then synchronize it.**

The core data model is centered on:

```text
Asset
 ├── Collections
 ├── Tags
 ├── Revisions
 ├── Favorites
 └── Sync Operations
```

with supporting infrastructure for:

```text
Devices
Search
Recent Activity
Settings
Sync State
Conflicts
```

The MVP database should remain simple enough to implement quickly while preserving the core properties required for a genuine local-first application:

```text
Fast local writes
Offline availability
Stable IDs
Transactional updates
Searchable content
Tombstone deletes
Revision tracking
Sync queue
Conflict persistence
```

This schema becomes the foundation for the next architectural documents, particularly **`IPC-SPEC.md`** and **`SYNC-PROTOCOL.md`**.
