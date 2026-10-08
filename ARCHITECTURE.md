# LumoSync — System Architecture

**Document:** `ARCHITECTURE.md`
**Status:** MVP / Demo Ready
**Application:** LumoSync — Local-First Code & Asset Manager
**Platform:** Electron Desktop
**Frontend:** React + TypeScript
**Persistence:** SQLite
**Architecture Style:** Local-first, layered desktop architecture
**Primary Goal:** Fast, reliable local asset management with asynchronous synchronization

---

# 1. Purpose

This document defines the high-level architecture of LumoSync.

It explains:

* Major application components
* Electron process boundaries
* Responsibility of each layer
* Data flow
* Dependency direction
* Database interaction
* IPC communication
* Synchronization architecture
* Search architecture
* State management
* Security boundaries
* Error handling
* Application lifecycle
* Deployment/runtime boundaries

The document intentionally focuses on **how the system is structured**, rather than defining every API or synchronization algorithm.

Detailed contracts will be defined in:

```text
DATABASE-SPEC.md
IPC-SPEC.md
SYNC-PROTOCOL.md
SECURITY-SPEC.md
```

---

# 2. Architectural Goals

LumoSync should satisfy the following architectural goals.

## 2.1 Local-first by default

Every primary user operation should complete against the local database first.

```text
User Action
    ↓
Local Validation
    ↓
SQLite Transaction
    ↓
UI Updated
    ↓
Background Sync
```

Network availability must not determine whether users can:

* create assets
* edit assets
* search
* organize assets
* favorite assets
* browse collections
* view recent assets

---

## 2.2 Secure Electron boundaries

The React renderer must not receive unrestricted access to:

* Node.js
* filesystem APIs
* SQLite
* operating-system credentials
* Electron internals

The renderer communicates with native capabilities through a deliberately limited preload API.

---

## 2.3 Fast UI response

The interface should feel immediate.

Operations such as:

```text
create
edit
favorite
tag
move
delete
restore
```

should normally complete locally before any remote operation begins.

---

## 2.4 Clear separation of responsibilities

The system should avoid putting business logic into:

* React components
* preload scripts
* IPC handlers
* SQL queries

Instead, responsibilities should be separated into application services and repositories.

---

## 2.5 Replaceable infrastructure

The UI should not depend directly on:

* SQLite implementation details
* a particular synchronization provider
* a particular remote API
* Electron-specific storage APIs

Where practical, application logic should depend on interfaces.

---

## 2.6 Demo-first without blocking future scale

The MVP architecture should be simple enough to implement quickly while leaving clear extension points for:

* cloud sync
* multiple devices
* conflict resolution
* team workspaces
* richer asset types
* account management

---

# 3. Architectural Style

LumoSync uses a **layered, local-first desktop architecture**.

Conceptually:

```text
┌───────────────────────────────────────────────────────┐
│                    React Renderer                     │
│                                                       │
│  UI / Components / View State / Client State         │
└──────────────────────────┬────────────────────────────┘
                           │
                     Secure IPC API
                           │
┌──────────────────────────▼────────────────────────────┐
│                    Preload Bridge                      │
│                                                       │
│      Narrow, Typed, Validated Native API             │
└──────────────────────────┬────────────────────────────┘
                           │
                    IPC Request/Events
                           │
┌──────────────────────────▼────────────────────────────┐
│                 Electron Main Process                 │
│                                                       │
│ Application Services / Domain Logic / Sync / OS APIs │
└───────────────┬─────────────────────┬─────────────────┘
                │                     │
                │                     │
        ┌───────▼────────┐    ┌───────▼──────────┐
        │ SQLite / Data  │    │ External Services│
        │     Layer      │    │ Sync / Auth etc. │
        └────────────────┘    └──────────────────┘
```

---

# 4. High-Level System

```text
                                      ┌──────────────────────┐
                                      │    Remote Sync API   │
                                      │   Future/External    │
                                      └──────────▲───────────┘
                                                 │
                                             Sync Engine
                                                 │
┌────────────────────────────────────────────────┴────────────────────┐
│                         Electron Main Process                       │
│                                                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │ IPC Handlers│→ │ App Services │→ │ Repositories / DB Services│ │
│  └─────────────┘  └──────┬───────┘  └─────────────┬─────────────┘ │
│                           │                         │               │
│                    ┌──────▼──────┐          ┌──────▼───────┐       │
│                    │ Sync Engine │          │    SQLite    │       │
│                    └─────────────┘          └──────────────┘       │
└────────────────────────────────────────────────────────────────────┘
                           ▲
                           │
                      Preload Bridge
                           ▲
                           │
┌──────────────────────────┴─────────────────────────────────────────┐
│                         React Renderer                             │
│                                                                   │
│  Pages → Feature Components → Query/Mutation Layer → IPC Client  │
│                                                                   │
│  Library / Search / Collections / Editor / Sync / Settings       │
└───────────────────────────────────────────────────────────────────┘
```

---

# 5. Process Architecture

Electron provides three important execution boundaries for LumoSync.

## 5.1 Main Process

The main process is the trusted native application layer.

Responsibilities include:

* Application lifecycle
* Window creation
* SQLite access
* Database migrations
* Filesystem operations
* Secure credential storage
* Synchronization engine
* IPC handlers
* Native OS integrations
* Auto-update lifecycle
* Application-level logging

The main process is the only layer that should directly perform privileged native operations.

---

# 6. Renderer Process

The renderer contains the user-facing application.

Responsibilities include:

* React UI
* Routing/navigation
* UI state
* Local interaction state
* Forms
* Editor state
* Search presentation
* Loading/error states
* Keyboard shortcuts
* Accessibility
* Visual synchronization indicators

The renderer should not contain:

* SQLite queries
* direct filesystem access
* secrets
* sync protocol implementation
* unrestricted Node APIs

---

# 7. Preload Process / Bridge

The preload layer is the controlled boundary between renderer and main.

Its purpose is to expose a **small, typed application API**.

Conceptually:

```text
React
  ↓
window.lumosync
  ↓
preload bridge
  ↓
ipcRenderer.invoke(...)
  ↓
main process
```

The renderer should consume something conceptually similar to:

```typescript
window.lumosync.assets.list(...)
window.lumosync.assets.create(...)
window.lumosync.assets.update(...)
window.lumosync.sync.getStatus(...)
```

rather than directly calling Electron IPC primitives throughout the UI.

---

# 8. Dependency Direction

Dependencies should move inward toward stable application logic.

Recommended direction:

```text
Renderer
   ↓
IPC Client Contract
   ↓
Preload API
   ↓
IPC Handlers
   ↓
Application Services
   ↓
Repositories / Infrastructure
   ↓
SQLite / OS / Network
```

The reverse direction should be avoided.

For example:

```text
❌ Repository → React component
❌ SQLite service → Renderer
❌ React component → SQL
❌ Sync engine → UI component
```

Instead:

```text
✅ UI → application API
✅ service → repository
✅ sync engine → synchronization repository/service
✅ repository → database
```

---

# 9. Recommended Project Structure

The project should be organized primarily by runtime boundary and application responsibility.

```text
src/
├── main/
│   ├── index.ts
│   │
│   ├── bootstrap/
│   │   ├── app-bootstrap.ts
│   │   └── dependency-container.ts
│   │
│   ├── database/
│   │   ├── connection.ts
│   │   ├── migrations/
│   │   ├── repositories/
│   │   └── queries/
│   │
│   ├── ipc/
│   │   ├── index.ts
│   │   ├── assets.handlers.ts
│   │   ├── collections.handlers.ts
│   │   ├── tags.handlers.ts
│   │   ├── search.handlers.ts
│   │   ├── sync.handlers.ts
│   │   └── settings.handlers.ts
│   │
│   ├── services/
│   │   ├── asset.service.ts
│   │   ├── collection.service.ts
│   │   ├── tag.service.ts
│   │   ├── search.service.ts
│   │   └── settings.service.ts
│   │
│   ├── sync/
│   │   ├── sync-engine.ts
│   │   ├── sync-queue.ts
│   │   ├── conflict-manager.ts
│   │   └── remote-client.ts
│   │
│   ├── security/
│   │   └── credential-store.ts
│   │
│   └── window/
│       └── create-window.ts
│
├── preload/
│   ├── index.ts
│   ├── api/
│   └── types/
│
├── renderer/
│   ├── app/
│   ├── routes/
│   │
│   ├── features/
│   │   ├── assets/
│   │   ├── collections/
│   │   ├── search/
│   │   ├── sync/
│   │   ├── settings/
│   │   └── onboarding/
│   │
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── styles/
│
└── shared/
    ├── types/
    ├── schemas/
    ├── constants/
    └── errors/
```

This structure can evolve as the codebase grows.

---

# 10. Shared Types

Types shared across renderer and main should live in a neutral shared area.

Examples:

```text
Asset
AssetType
Collection
Tag
Device
SyncStatus
Conflict
CreateAssetInput
UpdateAssetInput
AssetListQuery
```

Example:

```typescript
type AssetType =
  | "snippet"
  | "command"
  | "config"
  | "note"
  | "template";
```

Shared types must remain environment-neutral.

They must not import:

```text
electron
node
sqlite
react
```

---

# 11. Validation Schemas

Shared input validation schemas should exist for important IPC/API boundaries.

Recommended technology:

```text
Zod
```

Example conceptual schema:

```typescript
const createAssetSchema = z.object({
  type: assetTypeSchema,
  title: z.string().trim().min(1),
  description: z.string().optional(),
  language: z.string().optional(),
  content: z.string(),
  tags: z.array(z.string()).default([]),
});
```

Validation should occur:

```text
Renderer input
    ↓
Preload boundary
    ↓
Main handler
    ↓
Application service
```

The main process remains the authoritative validation boundary.

---

# 12. Application Service Layer

Application services coordinate business operations.

They should answer questions such as:

> What needs to happen when a user creates an asset?

Example:

```text
AssetService.create()
    ↓
validate input
    ↓
generate asset ID
    ↓
database transaction
    ├── create asset
    ├── create revision
    ├── create tag relationships
    ├── update search index
    └── queue sync operation
    ↓
return asset
```

The renderer should not orchestrate this sequence itself.

---

# 13. Repository Layer

Repositories provide persistence-oriented operations.

Example:

```typescript
interface AssetRepository {
  create(input: CreateAssetInput): Promise<Asset>;
  getById(id: string): Promise<Asset | null>;
  list(query: AssetListQuery): Promise<Asset[]>;
  update(id: string, input: UpdateAssetInput): Promise<Asset>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<Asset>;
}
```

Repositories should:

* execute SQL
* map database rows to domain/application models
* enforce persistence-level constraints
* remain unaware of React

Repositories should not:

* show notifications
* navigate the UI
* manipulate React state
* make UI decisions

---

# 14. Database Layer

The database layer consists of:

```text
Connection
Migrations
Repositories
Transactions
Queries
```

Only the main process should access SQLite.

Conceptually:

```text
services/
    ↓
repositories/
    ↓
database connection
    ↓
SQLite
```

---

# 15. Asset Architecture

The asset is the central domain entity.

```text
Asset
├── Metadata
│   ├── title
│   ├── type
│   ├── description
│   └── language
│
├── Content
│   └── content
│
├── Organization
│   ├── tags
│   └── collections
│
├── Local State
│   ├── favorite
│   └── recent activity
│
└── Sync State
    ├── version
    ├── revision
    ├── queue status
    └── conflict
```

This separation should be reflected in application services and UI components.

---

# 16. Local-First Write Path

The most important architectural flow is the write path.

## Example: Update Asset

```text
┌───────────────┐
│ React Editor  │
└───────┬───────┘
        │
        │ save
        ▼
┌─────────────────────┐
│ Preload API         │
│ assets.update(...)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ IPC Handler         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Asset Service       │
└─────────┬───────────┘
          │
          ▼
┌────────────────────────────────┐
│ SQLite Transaction             │
│                                │
│ UPDATE asset                   │
│ INSERT revision                │
│ INSERT sync operation         │
│ UPDATE search index            │
└───────────────┬────────────────┘
                │
                ▼
          local success
                │
                ▼
         React receives
          updated asset
                │
                ▼
      Background Sync Engine
```

The network is intentionally outside the critical write path.

---

# 17. Read Path

Typical asset read:

```text
React
  ↓
Preload API
  ↓
IPC
  ↓
AssetService
  ↓
AssetRepository
  ↓
SQLite
  ↓
Asset
  ↓
Renderer
```

The renderer should not maintain a second authoritative asset database.

Client-side state should be treated as a presentation/cache layer.

---

# 18. Renderer State Architecture

Renderer state should be divided into three categories.

## 18.1 Server/application state

Data retrieved from the main process:

```text
assets
collections
tags
devices
sync status
conflicts
```

This should preferably use a query/cache layer.

Recommended approach:

```text
TanStack Query
```

or an equivalent query abstraction.

---

## 18.2 UI state

Examples:

```text
selected asset
selected collection
sidebar state
modal open/closed
active filter
active sort
editor mode
```

This can remain local to components or be managed through a lightweight global store when needed.

---

## 18.3 Draft/editor state

An editor may contain unsaved changes.

Example:

```text
Persisted Asset
     +
Unsaved Draft
```

The draft must not overwrite SQLite until the save operation occurs.

This allows:

* dirty-state detection
* cancel
* keyboard save
* unsaved changes warning

---

# 19. Command / Search Architecture

The command palette and search UI should use the same underlying application capabilities as normal navigation.

Example:

```text
Ctrl/Cmd + K
       ↓
Command Palette
       ↓
Search / command resolution
       ↓
Application action
```

Commands should not contain direct SQL or Electron code.

Examples:

```text
Create Asset
Open Favorites
Open Collections
Search Assets
Start Sync
Open Settings
```

---

# 20. Search Architecture

Search should be local and fast.

```text
Search Input
    ↓
Debounced Query
    ↓
IPC Search API
    ↓
Search Service
    ↓
FTS5
    ↓
Filtered Asset Results
    ↓
Renderer
```

Search should not require network access.

Remote search may be introduced later, but it should not replace local search.

---

# 21. Synchronization Architecture

Synchronization is deliberately isolated from normal asset CRUD.

Core model:

```text
Local Database
      │
      ├── assets
      ├── revisions
      └── sync_operations
               │
               ▼
          Sync Engine
               │
       ┌───────┴────────┐
       │                │
      Push             Pull
       │                │
       ▼                ▼
              Remote Service
```

The sync engine is responsible for:

* detecting pending operations
* batching operations
* sending remote mutations
* receiving remote changes
* tracking cursors/checkpoints
* handling retries
* detecting conflicts
* updating local sync state

The detailed protocol belongs in `SYNC-PROTOCOL.md`.

---

# 22. Sync Must Not Own the UI

The sync engine should never directly manipulate React state.

Instead:

```text
Sync Engine
    ↓
Database update
    ↓
IPC/event notification
    ↓
Renderer refresh/invalidation
```

This keeps synchronization independent from the UI.

---

# 23. Synchronization Event Flow

Example:

```text
Remote change received
        ↓
Sync Engine
        ↓
Conflict detection
        ↓
SQLite transaction
        ↓
Asset / conflict state updated
        ↓
Application event emitted
        ↓
Renderer receives event
        ↓
Query invalidated
        ↓
UI refreshes
```

---

# 24. Event Architecture

Some application state changes should be communicated as events rather than request/response calls.

Examples:

```text
asset.updated
asset.deleted
sync.started
sync.progress
sync.completed
sync.failed
sync.conflict
device.updated
```

Example:

```text
main
  ↓
webContents.send(...)
  ↓
preload listener
  ↓
renderer event handler
```

The exact event contracts will be defined by `IPC-SPEC.md`.

---

# 25. Request/Response vs Events

Use request/response when the renderer explicitly asks for something.

Examples:

```text
assets.get()
assets.list()
collections.list()
settings.get()
sync.getStatus()
```

Use events when the state changes asynchronously.

Examples:

```text
sync.started
sync.completed
sync.conflict
asset.updated
```

This distinction should remain consistent throughout the application.

---

# 26. Optimistic UI

Because LumoSync is local-first, many operations do not require traditional network-style optimistic updates.

Instead, use:

> **local confirmation first**

Example:

```text
User clicks Favorite
        ↓
SQLite updates
        ↓
Mutation returns success
        ↓
UI shows favorite
        ↓
Sync occurs later
```

This is more accurate than treating the action as "optimistic" because the local database is authoritative for the immediate operation.

---

# 27. Conflict Architecture

Conflicts are created when local and remote versions cannot be safely reconciled automatically.

Conceptually:

```text
Local Version
      │
      │
      ├──────────────┐
      │              │
      ▼              ▼
Local Change    Remote Change
      │              │
      └──────┬───────┘
             ▼
        Conflict
             │
             ▼
      Conflict UI
             │
       ┌─────┴─────┐
       ▼           ▼
 Keep Local    Keep Remote
       │           │
       └─────┬─────┘
             ▼
       New resolved state
```

The first demo should prefer a predictable conflict model over an overly sophisticated merge engine.

---

# 28. Conflict UI Boundary

The UI should receive a conflict model, not raw synchronization internals.

Example:

```typescript
interface AssetConflict {
  id: string;
  assetId: string;
  local: AssetRevision;
  remote: AssetRevision;
  detectedAt: string;
}
```

The UI can then render:

```text
LOCAL
─────
title
content
metadata

REMOTE
──────
title
content
metadata

[Keep Local]
[Keep Remote]
```

---

# 29. Device Architecture

Each installation has a local device identity.

Conceptually:

```text
Installation
    ↓
Device ID
    ↓
Device metadata
    ↓
Sync identity
```

The device record should include:

```text
device ID
device name
platform
app version
last seen
```

The current device must be locally identifiable.

---

# 30. Application Startup

Startup should occur in controlled phases.

```text
Electron Start
      ↓
Load application configuration
      ↓
Initialize logging
      ↓
Initialize database
      ↓
Run migrations
      ↓
Initialize repositories
      ↓
Initialize services
      ↓
Initialize sync engine
      ↓
Register IPC handlers
      ↓
Create BrowserWindow
      ↓
Load renderer
      ↓
Application Ready
```

The renderer should not become interactive before the minimum required database initialization is complete.

---

# 31. First Launch

On first launch:

```text
Application starts
       ↓
Initialize database
       ↓
Create local device ID
       ↓
Create default settings
       ↓
Optional onboarding state
       ↓
Open main window
```

The application must remain usable even if the user skips account/sync configuration.

---

# 32. Onboarding Architecture

Onboarding should not be coupled to the synchronization service.

Recommended flow:

```text
First Launch
    ↓
Local database ready
    ↓
Introduce local-first model
    ↓
Optional sync/account setup
    ↓
Library
```

The user should be able to reach the main application without registering for cloud sync if local-only mode is supported.

---

# 33. Offline Architecture

Offline state should be treated as normal.

```text
Network Available
      ↓
Sync normally
```

or:

```text
Network unavailable
      ↓
Local operations continue
      ↓
Sync operations queued
      ↓
Network returns
      ↓
Queue processed
```

The UI should show sync status but should not block core functionality.

---

# 34. Background Sync

The sync engine should operate independently from the main CRUD request.

Possible triggers:

```text
Application startup
Manual sync
Periodic sync
After local mutation
Network recovery
Account reconnection
```

The first demo may implement:

```text
startup sync
manual sync
post-mutation background sync
```

Periodic/background scheduling can be refined later.

---

# 35. Sync Failure Handling

A failed remote operation must not undo successful local persistence.

Example:

```text
Local update
    ↓
SQLite success
    ↓
Queue sync
    ↓
Remote request fails
    ↓
Keep local state
    ↓
Mark operation failed
    ↓
Retry later
```

This is a core local-first property.

---

# 36. Retry Architecture

Sync failures should include:

```text
attempt_count
last_attempt_at
last_error
```

The retry system should distinguish between:

### Temporary failure

Examples:

```text
network unavailable
timeout
server unavailable
```

Retry automatically.

### Permanent failure

Examples:

```text
invalid request
unsupported operation
authorization failure
```

Do not retry indefinitely.

The sync engine should expose the failure state to the UI.

---

# 37. Security Boundary

The architecture assumes the following boundary:

```text
                 TRUSTED
┌───────────────────────────────────────┐
│ Electron Main                         │
│ SQLite                                │
│ Credential Store                      │
│ Sync Engine                           │
│ Native APIs                           │
└──────────────────┬────────────────────┘
                   │
              Controlled IPC
                   │
┌──────────────────▼────────────────────┐
│ Renderer                              │
│ React UI                              │
│ Untrusted application content         │
└───────────────────────────────────────┘
```

Application content such as code snippets must be treated as **user-controlled data**, not executable application code.

Detailed hardening belongs in `SECURITY-SPEC.md`.

---

# 38. Filesystem Architecture

Filesystem operations should be isolated behind an application service.

Do not allow arbitrary renderer paths to be passed directly into native filesystem functions without validation.

Conceptually:

```text
Renderer
   ↓
File API
   ↓
Preload
   ↓
IPC validation
   ↓
File Service
   ↓
Filesystem
```

Potential future filesystem capabilities:

```text
Import asset
Export asset
Open containing folder
Attach file
```

The first demo should only expose filesystem capabilities that are actually required.

---

# 39. Logging Architecture

Logging should occur primarily in the main process.

Recommended levels:

```text
debug
info
warn
error
```

Examples:

```text
[INFO] Database initialized
[INFO] Migration completed
[INFO] Sync started
[WARN] Sync retry scheduled
[ERROR] Database transaction failed
```

Sensitive values must never be logged.

Especially:

```text
tokens
credentials
passwords
encryption keys
authorization headers
```

---

# 40. Error Architecture

Application errors should use stable error codes.

Example:

```typescript
type ErrorCode =
  | "VALIDATION_ERROR"
  | "ASSET_NOT_FOUND"
  | "DATABASE_ERROR"
  | "SYNC_ERROR"
  | "CONFLICT_DETECTED"
  | "AUTH_REQUIRED"
  | "NETWORK_ERROR"
  | "PERMISSION_DENIED";
```

Conceptually:

```typescript
interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}
```

The renderer should receive safe, user-appropriate errors.

Internal stack traces belong in logs, not UI messages.

---

# 41. Transaction Boundary

Transactions should exist at the application service level whenever a user operation modifies multiple persistence structures.

For example:

```text
AssetService.update()
      ↓
BEGIN
      ├── update assets
      ├── create revision
      ├── update tags
      ├── update FTS
      └── create sync operation
COMMIT
```

This ensures the application does not reach a state where:

```text
asset updated
but
sync operation missing
```

or:

```text
asset updated
but
search index stale
```

without an explicit recovery mechanism.

---

# 42. Caching Strategy

The SQLite database is the persistent local source of truth.

The renderer may maintain transient cache state.

Recommended conceptual hierarchy:

```text
SQLite
  ↓
Application Service
  ↓
Renderer Query Cache
  ↓
React Components
```

The renderer cache must never be treated as more authoritative than SQLite.

---

# 43. State Invalidation

When a main-process event changes data:

```text
asset.updated
```

the renderer should invalidate the affected query rather than manually updating every UI representation.

Example:

```text
asset.updated
     ↓
invalidate ["assets"]
invalidate ["asset", id]
```

This reduces state duplication.

---

# 44. Application-Level Modules

Recommended major application modules:

```text
Assets
Collections
Tags
Search
Recent
Settings
Devices
Sync
Conflicts
Onboarding
```

Each module should expose a focused service/API rather than creating one large global service.

---

# 45. Module Responsibility Matrix

| Module      | Responsibility                   |
| ----------- | -------------------------------- |
| Assets      | Asset CRUD and metadata          |
| Collections | Collection CRUD and memberships  |
| Tags        | Tag CRUD and relationships       |
| Search      | Local asset search               |
| Recent      | Recent asset tracking            |
| Settings    | User/application preferences     |
| Devices     | Local and remote device metadata |
| Sync        | Push/pull synchronization        |
| Conflicts   | Conflict persistence/resolution  |
| Onboarding  | First-launch experience          |

---

# 46. What Should Stay Out of the Architecture

The following should not be introduced simply for architectural completeness:

* Microservices
* Local HTTP server
* Event sourcing for every entity
* CQRS split across separate databases
* GraphQL layer
* Repository generators
* Complex dependency injection framework
* Remote database dependency for basic functionality

LumoSync is a desktop application.

A direct:

```text
Renderer → IPC → Main → SQLite
```

architecture is preferable to adding unnecessary infrastructure.

---

# 47. Dependency Injection

A lightweight dependency composition approach is recommended.

Conceptually:

```text
createDatabase()
      ↓
createRepositories(database)
      ↓
createServices(repositories)
      ↓
createSyncEngine(services)
      ↓
registerIpcHandlers(services)
```

This allows tests to replace real implementations with mocks/fakes without introducing a heavy framework.

---

# 48. Testing Architecture

Testing should occur at multiple levels.

## Unit

Test:

```text
services
validators
mappers
sync decisions
conflict logic
utilities
```

## Integration

Test:

```text
repositories + SQLite
transactions
migrations
search
sync queue persistence
```

## IPC

Test:

```text
request validation
handler behavior
error translation
event delivery
```

## End-to-end

Test:

```text
launch app
create asset
edit asset
search
favorite
organize
restart
verify persistence
```

Detailed testing belongs in `TEST-PLAN.md`.

---

# 49. Demo Architecture

The first polished demo should emphasize this path:

```text
Launch
  ↓
Library
  ↓
Create Asset
  ↓
Edit Asset
  ↓
Save
  ↓
Instant local persistence
  ↓
Search
  ↓
Favorite
  ↓
Add Tags
  ↓
Add to Collection
  ↓
Restart application
  ↓
Everything remains available
  ↓
Show Sync Status
```

This demonstrates the core value proposition without requiring every future feature.

---

# 50. Demo Sync Path

When synchronization is included in the demo:

```text
Device A
   │
   │ create/update asset
   ▼
SQLite
   │
   ▼
Sync Queue
   │
   ▼
Remote Service
   │
   ▼
Device B
   │
   ▼
SQLite
   │
   ▼
Renderer
```

Conflict demonstration:

```text
Device A
   │
   └── edits asset
       
Device B
   │
   └── edits same asset

          ↓

     Sync Conflict

          ↓

   Conflict UI

   [Keep Local]
   [Keep Remote]
```

---

# 51. Architecture Decisions

The following decisions are considered foundational.

## ADR-001 — Local-first persistence

**Decision:** SQLite is the immediate persistence layer and user operations do not depend on network availability.

**Reason:** LumoSync's primary product promise is reliable local access and offline continuity.

---

## ADR-002 — Electron main owns native capabilities

**Decision:** SQLite, filesystem, credentials, synchronization, and other privileged operations live in the main process.

**Reason:** Provides a clear security boundary and prevents renderer code from directly accessing privileged APIs.

---

## ADR-003 — Preload exposes a narrow API

**Decision:** Renderer accesses native functionality through a typed preload bridge.

**Reason:** Preserves Electron's process separation and allows IPC contracts to be validated.

---

## ADR-004 — SQLite as local source of truth

**Decision:** The application does not maintain a second persistent local store for assets.

**Reason:** Minimizes synchronization between local state stores and simplifies recovery.

---

## ADR-005 — Background synchronization

**Decision:** Remote synchronization occurs after local persistence rather than blocking local writes.

**Reason:** Network failure must not prevent normal asset management.

---

## ADR-006 — UUID-based entity identifiers

**Decision:** Synchronizable entities use client-generated globally unique IDs.

**Reason:** Devices must be able to create records independently.

---

## ADR-007 — Tombstone deletion

**Decision:** Synchronizable entities use logical deletion instead of immediate physical deletion.

**Reason:** Other devices need deletion information during synchronization.

---

# 52. Architecture Invariants

The following rules should remain true as the codebase evolves.

### Invariant 1

The renderer never directly accesses SQLite.

### Invariant 2

The renderer never receives unrestricted Node.js access.

### Invariant 3

A successful local mutation is persisted before synchronization begins.

### Invariant 4

A sync failure does not roll back a successful local mutation.

### Invariant 5

Sync logic does not directly manipulate React state.

### Invariant 6

Application services coordinate business operations.

### Invariant 7

Repositories own persistence details.

### Invariant 8

Shared models remain environment-neutral.

### Invariant 9

Secrets do not live in the regular application database.

### Invariant 10

The application remains usable when offline.

---

# 53. Architecture Evolution

The initial architecture is intentionally designed to support future growth.

## MVP

```text
Electron
React
SQLite
Local CRUD
Search
Basic Sync
```

## Phase 2

```text
Remote synchronization
Device management
Conflict resolution
Improved retry handling
```

## Phase 3

```text
Accounts
Shared workspaces
Team collections
Permissions
```

## Phase 4

```text
Advanced collaboration
Team-level synchronization
Asset sharing
Enterprise controls
```

The architecture should evolve through additional modules rather than replacing the local-first foundation.

---

# 54. Recommended Implementation Order

To reach a demo quickly, implementation should follow dependency order.

## Phase 1 — Foundation

```text
Electron shell
React renderer
Preload bridge
SQLite connection
Migration system
Application bootstrap
```

## Phase 2 — Core Data

```text
Asset repository
Collection repository
Tag repository
Recent repository
Settings repository
```

## Phase 3 — Core Services

```text
Asset service
Collection service
Tag service
Search service
Settings service
```

## Phase 4 — UI

```text
App shell
Library
Asset detail
Asset editor
Collections
Favorites
Search
Settings
```

## Phase 5 — Local-first behavior

```text
Transactions
Revisions
Sync queue
Local status
Offline behavior
```

## Phase 6 — Synchronization

```text
Sync engine
Push
Pull
Retry
Device state
Conflicts
Conflict UI
```

This allows a compelling local-only demo before the complete synchronization system is finished.

---

# 55. Architecture Acceptance Criteria

The architecture is considered implemented correctly when:

* [ ] React cannot directly access SQLite.
* [ ] React cannot directly access unrestricted Node.js APIs.
* [ ] Native operations cross the preload/IPC boundary.
* [ ] Application services own business workflows.
* [ ] Repositories own database persistence.
* [ ] SQLite is the local source of truth.
* [ ] Asset mutations are transactional.
* [ ] Search executes locally.
* [ ] Local operations work without network access.
* [ ] Synchronization runs independently from CRUD.
* [ ] Sync failures do not destroy successful local state.
* [ ] Conflicts can be represented independently of the UI.
* [ ] Device identity exists outside the renderer.
* [ ] Secrets are stored outside the normal SQLite data model.
* [ ] Renderer state is treated as a presentation/cache layer.
* [ ] Application events can notify the renderer about asynchronous changes.
* [ ] The project structure preserves clear runtime boundaries.

---

# 56. Final Architecture

The resulting LumoSync architecture can be summarized as:

```text
                         ┌───────────────────────┐
                         │      Remote API       │
                         │   Sync Infrastructure │
                         └───────────▲───────────┘
                                     │
                                Sync Engine
                                     │
┌────────────────────────────────────┴──────────────────────────────────┐
│                         ELECTRON MAIN PROCESS                         │
│                                                                      │
│ ┌────────────┐   ┌───────────────┐   ┌────────────────────────────┐ │
│ │ IPC Handlers│ → │ App Services │ → │ Repositories / DB Services │ │
│ └────────────┘   └───────────────┘   └──────────────┬─────────────┘ │
│                                                     │               │
│                                              ┌──────▼──────┐        │
│                                              │    SQLite   │        │
│                                              └─────────────┘        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                         Secure Preload API
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│                         REACT RENDERER                              │
│                                                                      │
│  App Shell                                                         │
│     ↓                                                               │
│  Features                                                           │
│     ├── Assets                                                       │
│     ├── Collections                                                 │
│     ├── Search                                                       │
│     ├── Sync                                                         │
│     ├── Conflicts                                                    │
│     └── Settings                                                     │
│                                                                      │
│  Query Cache + UI State + Editor State                             │
└──────────────────────────────────────────────────────────────────────┘
```

The architectural principle is:

> **The renderer presents the application, the main process owns the application, SQLite owns local persistence, and the sync engine connects local state to remote state without making the network a prerequisite for using LumoSync.**

---

# 57. Related Documents

This architecture should be read alongside:

```text
PRD.md
TDD.md
UI-SPEC.md
DATABASE-SPEC.md
IPC-SPEC.md
SYNC-PROTOCOL.md
SECURITY-SPEC.md
TEST-PLAN.md
```

Recommended next document:

```text
IPC-SPEC.md
```

because the architecture now establishes the exact boundary that the IPC contract needs to formalize.
