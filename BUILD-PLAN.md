# LumoSync — Build Plan

**Document:** `BUILD-PLAN.md`
**Status:** MVP / Demo Ready
**Application:** LumoSync — Local-First Code & Asset Manager
**Build Strategy:** Incremental, testable, demo-first
**Primary Goal:** Reach a polished local-first desktop demo quickly, then layer synchronization and production hardening on top.

---

# 1. Purpose

This document defines the implementation roadmap for LumoSync.

The project is divided into phases so that:

* Each phase produces working software.
* Dependencies are implemented in the correct order.
* The first usable demo is reached as early as possible.
* Synchronization does not block the initial product experience.
* Architecture and documentation remain aligned with implementation.
* Features can be adjusted incrementally during development.

The build follows this principle:

> **Build the smallest complete local-first experience first, then progressively add synchronization, conflict handling, and production hardening.**

---

# 2. Build Philosophy

## 2.1 Demo-first

The first major milestone is not "all MVP features completed."

It is:

> A user can launch LumoSync, create and organize developer assets, search them, close the application, reopen it, and find everything still available.

This proves the most important product foundation.

---

## 2.2 Vertical slices over isolated infrastructure

Features should preferably be implemented end-to-end.

Instead of:

```text
Build every repository
Build every service
Build every IPC handler
Then build UI
```

prefer:

```text
Asset creation
    ↓
Database
    ↓
Service
    ↓
IPC
    ↓
Renderer
    ↓
Working feature
```

Then repeat for the next capability.

---

## 2.3 Do not overbuild before the demo

Avoid implementing future requirements such as:

* team workspaces
* advanced permissions
* sophisticated merge algorithms
* complex analytics
* plugin systems

before the core local-first experience is working.

---

# 3. Phase Overview

```text
Phase 0   Project Foundation
    ↓
Phase 1   Database & Persistence
    ↓
Phase 2   Electron Architecture & IPC
    ↓
Phase 3   Core Asset Management
    ↓
Phase 4   Organization & Search
    ↓
Phase 5   Local-First UX & Polish
    ↓
──────── DEMO 1 ────────
    ↓
Phase 6   Sync Foundation
    ↓
Phase 7   Multi-Device Sync
    ↓
Phase 8   Conflict Resolution
    ↓
──────── DEMO 2 ────────
    ↓
Phase 9   Security & Hardening
    ↓
Phase 10  Testing & Reliability
    ↓
Phase 11  Packaging & Release
    ↓
──────── RELEASE ───────
```

---

# 4. Phase 0 — Project Foundation

## Objective

Create the application skeleton and establish the development environment.

## Deliverables

```text
Electron application
React renderer
TypeScript configuration
Preload entry point
Shared types directory
Development scripts
Linting
Formatting
Environment configuration
Basic logging
```

## Tasks

### 0.1 Initialize project

Set up:

```text
Electron
React
TypeScript
Vite or equivalent renderer build
```

Establish the final project structure from `ARCHITECTURE.md`.

---

### 0.2 Configure Electron boundaries

Implement:

```text
main process
preload
renderer
```

Enable:

```text
contextIsolation
```

Avoid unrestricted renderer Node access.

The exact security configuration will be formalized later in `SECURITY-SPEC.md`.

---

### 0.3 Establish shared layer

Create:

```text
src/shared/
    types/
    schemas/
    constants/
    errors/
```

---

### 0.4 Create application shell

Implement:

```text
BrowserWindow
AppShell
Sidebar
Header
Main content area
```

The UI does not need to be feature-complete yet.

---

### 0.5 Add developer tooling

Configure:

```text
ESLint
Prettier
TypeScript strict mode
Git hooks if useful
```

---

## Exit Criteria

* [ ] Application launches.
* [ ] React renderer loads.
* [ ] Preload loads successfully.
* [ ] Renderer cannot directly use Node APIs.
* [ ] Shared TypeScript types compile.
* [ ] Basic application shell is visible.
* [ ] Development build is repeatable.

---

# 5. Phase 1 — Database & Persistence

## Objective

Make the application capable of reliably storing local data.

## Deliverables

```text
SQLite connection
Migration runner
Initial schema
Database repositories
Transaction helper
Application metadata
Device identity
```

---

## Tasks

### 1.1 Configure SQLite

Implement:

```text
database connection
WAL mode
foreign keys
busy timeout
transaction support
```

---

### 1.2 Implement migrations

Create:

```text
001_initial_schema.sql
```

Containing the MVP tables from `DATABASE-SPEC.md`.

---

### 1.3 Implement database repositories

Start with:

```text
AssetRepository
CollectionRepository
TagRepository
RecentRepository
SettingsRepository
DeviceRepository
```

---

### 1.4 Implement ID and timestamp utilities

Centralize:

```text
UUID generation
UTC timestamp generation
```

---

### 1.5 Implement device initialization

On first application startup:

```text
generate device ID
store device metadata
mark current device
```

---

### 1.6 Add database tests

Test:

```text
migration
connection
CRUD
foreign keys
transactions
persistence across restart
```

---

## Exit Criteria

* [ ] Database initializes automatically.
* [ ] Migrations run successfully.
* [ ] Application survives restart without losing local data.
* [ ] Repositories can create/read/update/delete core records.
* [ ] Transactions work.
* [ ] Current device identity exists.
* [ ] Database tests pass.

---

# 6. Phase 2 — Electron IPC Architecture

## Objective

Create the secure communication layer between React and the main process.

## Deliverables

```text
Typed preload API
IPC handlers
Request validation
Response types
Application error model
Event infrastructure
```

---

## Tasks

### 2.1 Define IPC contracts

Create the initial contract for:

```text
assets
collections
tags
search
recent
settings
device
```

---

### 2.2 Create preload API

Example:

```typescript
window.lumosync.assets.list()
window.lumosync.assets.create()
window.lumosync.assets.update()
window.lumosync.assets.delete()
```

---

### 2.3 Create IPC handlers

Handlers should:

1. Validate input.
2. Invoke application service.
3. Return a typed result.
4. Translate internal errors.

---

### 2.4 Add event bridge

Create infrastructure for:

```text
asset.updated
asset.deleted
sync.statusChanged
sync.conflict
```

The sync-specific events can initially remain unused.

---

## Exit Criteria

* [ ] Renderer can communicate with main through typed APIs.
* [ ] IPC inputs are validated.
* [ ] Internal database errors do not leak directly to the renderer.
* [ ] Events can flow from main to renderer.
* [ ] No renderer code directly accesses SQLite.

---

# 7. Phase 3 — Core Asset Management

## Objective

Build the first complete vertical slice.

## Deliverable

A user can create, view, edit, save, delete, and restore an asset.

---

## Tasks

### 3.1 Asset service

Implement:

```text
createAsset
getAsset
listAssets
updateAsset
deleteAsset
restoreAsset
```

---

### 3.2 Asset transactions

Creation should atomically perform:

```text
asset
revision
sync operation
search index
```

The sync operation may remain pending until the sync engine exists.

---

### 3.3 Library UI

Implement:

```text
asset list
asset row
empty state
loading state
error state
```

---

### 3.4 Asset detail

Implement:

```text
title
type
language
description
content
tags
favorite
updated time
```

---

### 3.5 Asset editor

Implement:

```text
edit mode
save
cancel
dirty state
unsaved changes warning
```

---

### 3.6 Delete / restore

Implement:

```text
soft delete
deleted state
restore
```

---

## Exit Criteria

A user can:

```text
Create
Open
Edit
Save
Delete
Restore
Restart application
Verify persistence
```

without any network connection.

---

# 8. Phase 4 — Organization & Search

## Objective

Make LumoSync useful as a real developer asset manager rather than simply an editor.

## Deliverables

```text
Collections
Tags
Favorites
Recent assets
Local search
Filtering
Sorting
```

---

## Tasks

### 4.1 Collections

Implement:

```text
create collection
rename collection
delete collection
add asset
remove asset
view collection
```

---

### 4.2 Tags

Implement:

```text
create tag
attach tag
remove tag
rename tag
```

Avoid duplicate normalized tags.

---

### 4.3 Favorites

Implement:

```text
favorite
unfavorite
favorites view
```

---

### 4.4 Recent assets

Record:

```text
opened_at
open_count
```

Build the Recent view.

---

### 4.5 Search

Implement:

```text
FTS5
search input
debouncing
ranking
type filtering
tag filtering
collection filtering
favorite filtering
```

---

### 4.6 Sorting

Support:

```text
Recently Updated
Recently Created
Alphabetical
Recently Opened
```

---

## Exit Criteria

* [ ] Assets can be organized.
* [ ] Tags work.
* [ ] Collections work.
* [ ] Favorites work.
* [ ] Recent assets work.
* [ ] Search works completely offline.
* [ ] Filters and sorting work together.

---

# 9. Phase 5 — Local-First UX & Polish

## Objective

Make the product feel like a finished desktop application rather than a prototype.

This is the first major **demo preparation phase**.

---

## Tasks

### 5.1 Sync status foundation

Even before remote synchronization works, expose local states such as:

```text
Saved
Pending Sync
Offline
```

---

### 5.2 Loading states

Every asynchronous operation should have intentional states:

```text
loading
success
empty
error
```

---

### 5.3 Toasts

Implement feedback for:

```text
asset created
asset saved
asset deleted
asset restored
collection created
tag added
sync queued
errors
```

---

### 5.4 Keyboard shortcuts

Prioritize:

```text
Ctrl/Cmd + K
Ctrl/Cmd + N
Ctrl/Cmd + S
Ctrl/Cmd + F
Escape
```

---

### 5.5 Command palette

Implement:

```text
Open Search
Create Asset
Open Favorites
Open Collections
Open Recent
Open Settings
```

---

### 5.6 Empty and onboarding states

Build:

```text
first launch
empty library
empty collection
no search results
no favorites
```

---

### 5.7 Desktop polish

Implement:

```text
window state persistence
sidebar collapse
responsive split pane
scroll behavior
context menus
keyboard navigation
focus management
```

---

### 5.8 Visual refinement

Apply the UI-SPEC:

```text
spacing
typography
semantic colors
code typography
icons
borders
radii
dark/light/system theme
```

---

## Exit Criteria

The application should feel demoable from launch to completion.

---

# 10. DEMO MILESTONE 1 — Local-First LumoSync

At this point, the application should support:

```text
Launch
  ↓
Onboarding
  ↓
Library
  ↓
Create asset
  ↓
Edit asset
  ↓
Save locally
  ↓
Favorite
  ↓
Tag
  ↓
Collection
  ↓
Search
  ↓
Open recent
  ↓
Delete / restore
  ↓
Close application
  ↓
Reopen
  ↓
Everything persists
```

This is a meaningful first demo.

The synchronization engine is intentionally not required for this milestone.

---

# 11. Phase 6 — Synchronization Foundation

## Objective

Connect the existing local-first data model to a remote synchronization service.

## Deliverables

```text
Sync engine
Sync queue processor
Remote client
Push workflow
Pull workflow
Retry handling
Sync state
```

---

## Tasks

### 6.1 Define remote sync interface

The sync engine should communicate through an abstraction:

```typescript
interface SyncRemoteClient {
  push(operations: SyncOperation[]): Promise<PushResult>;
  pull(cursor?: string): Promise<PullResult>;
}
```

The implementation should remain replaceable.

---

### 6.2 Implement sync queue processor

Process:

```text
pending
    ↓
processing
    ↓
completed
```

Handle failure:

```text
processing
    ↓
failed
    ↓
retry
```

---

### 6.3 Implement push

Send pending local operations.

Support:

```text
batching
idempotency
acknowledgement
version information
```

---

### 6.4 Implement pull

Retrieve remote changes and apply them to the local database.

---

### 6.5 Persist sync state

Track:

```text
last successful sync
last attempt
cursor
error
status
```

---

### 6.6 Trigger synchronization

Initial triggers:

```text
manual
startup
after local mutation
network recovery
```

---

## Exit Criteria

* [ ] Local mutations become sync operations.
* [ ] Pending operations can be pushed.
* [ ] Remote changes can be pulled.
* [ ] Sync survives application restart.
* [ ] Temporary network failures can recover.
* [ ] Duplicate operations do not create duplicate data.

---

# 12. Phase 7 — Multi-Device Synchronization

## Objective

Demonstrate the central cross-device value proposition.

## Tasks

### 7.1 Device registration

Support:

```text
device creation
device metadata
last seen
current device
```

---

### 7.2 New-device bootstrap

A new device should be able to:

```text
initialize local database
register device
pull existing data
populate local database
```

---

### 7.3 Remote updates

If Device A changes an asset:

```text
Device A
  ↓
sync
  ↓
remote
  ↓
Device B
  ↓
local database
  ↓
UI
```

Device B should see the updated asset after synchronization.

---

### 7.4 Sync UI

Implement:

```text
Sync indicator
Sync screen
Last synced time
Pending count
Error state
Manual sync
```

---

### 7.5 Device management

Implement:

```text
device list
device name
platform
last seen
current device indicator
```

---

## Exit Criteria

* [ ] Two devices can synchronize assets.
* [ ] New-device bootstrap works.
* [ ] Sync status is visible.
* [ ] Offline changes synchronize after reconnection.
* [ ] Duplicate operations are handled safely.

---

# 13. Phase 8 — Conflict Resolution

## Objective

Make concurrent editing understandable and recoverable.

---

## Tasks

### 8.1 Detect conflicts

Conflict detection should use:

```text
asset ID
base version
local version
remote version
```

---

### 8.2 Store conflict

Persist both versions:

```text
local payload
remote payload
```

Neither version should be silently discarded.

---

### 8.3 Conflict UI

Implement:

```text
Conflicts list
Conflict detail
Local version
Remote version
```

---

### 8.4 Initial resolution actions

Support:

```text
Keep Local
Keep Remote
```

---

### 8.5 Resolution persistence

A resolved conflict must:

```text
update local state
create appropriate revision
clear/resolve conflict
queue resulting sync operation
```

---

### 8.6 Advanced merge

Manual field/content merge should be treated as a later enhancement unless it is needed for the demo.

---

## Exit Criteria

* [ ] Concurrent changes can produce a conflict.
* [ ] Both versions remain recoverable.
* [ ] User can select a resolution.
* [ ] Resolution synchronizes correctly.
* [ ] No silent data loss occurs.

---

# 14. DEMO MILESTONE 2 — Full Local-First Sync

The second major demo should show:

```text
Device A
   ↓
Create/edit asset
   ↓
Local save
   ↓
Sync
   ↓
Device B receives change
```

Then demonstrate:

```text
Device A → offline
        ↓
edit asset
        ↓
queue change
        ↓
reconnect
        ↓
sync
        ↓
Device B updated
```

Finally:

```text
Device A edits asset
Device B edits same asset
        ↓
Conflict
        ↓
Conflict UI
        ↓
Keep Local / Keep Remote
```

This demonstrates the central architectural value of LumoSync.

---

# 15. Phase 9 — Security & Hardening

## Objective

Move the application from demo-quality architecture toward production-quality security.

---

## Tasks

### 9.1 Electron hardening

Review:

```text
contextIsolation
sandbox
nodeIntegration
webSecurity
navigation controls
window creation
external links
```

---

### 9.2 IPC hardening

Verify:

```text
input validation
channel allowlists
safe error responses
argument normalization
```

---

### 9.3 Credential storage

Implement secure OS credential storage for:

```text
auth tokens
refresh tokens
sync credentials
```

---

### 9.4 Content security

Implement appropriate CSP and ensure asset content is displayed as data rather than executable HTML/JS.

---

### 9.5 Update security

Verify:

```text
signed releases
secure update channel
integrity validation
```

---

### 9.6 Dependency security

Review:

```text
npm audit / equivalent
outdated dependencies
Electron version
native modules
```

---

## Exit Criteria

* [ ] Electron security configuration reviewed.
* [ ] IPC boundaries hardened.
* [ ] Secrets stored securely.
* [ ] User content cannot execute as application code.
* [ ] Release/update security is defined.

---

# 16. Phase 10 — Testing & Reliability

## Objective

Establish confidence before release.

---

## Test Layers

### Unit

```text
validators
services
sync decisions
conflict resolution
utilities
```

### Integration

```text
repositories
SQLite
transactions
migrations
FTS
sync queue
```

### IPC

```text
request validation
handlers
events
errors
```

### End-to-End

```text
launch
create
edit
search
organize
restart
sync
conflict
```

---

## Reliability Testing

Test:

```text
application restart during write
network loss during sync
network loss after local mutation
remote failure
duplicate sync operation
corrupt/invalid payload
failed migration
large asset collection
long offline period
```

---

## Exit Criteria

* [ ] Critical user flows have automated coverage.
* [ ] Database migrations are tested.
* [ ] Sync retries are tested.
* [ ] Conflicts are tested.
* [ ] Restart/recovery scenarios pass.
* [ ] No critical data-loss path remains.

---

# 17. Phase 11 — Packaging & Release

## Objective

Produce installable builds for supported platforms.

---

## Tasks

### 11.1 Production configuration

Define:

```text
production environment
application identifiers
build metadata
update configuration
```

---

### 11.2 Packaging

Build:

```text
Windows
macOS
Linux
```

according to the supported release matrix.

---

### 11.3 Code signing

Configure platform-specific signing where applicable.

---

### 11.4 Auto-update

Implement:

```text
update check
download
install
restart
```

with user-friendly status.

---

### 11.5 Release artifacts

Produce:

```text
installer
portable build if required
checksums
release notes
```

---

## Exit Criteria

* [ ] Production builds install successfully.
* [ ] App launches correctly from installed build.
* [ ] Database initializes in production path.
* [ ] Existing data survives application updates.
* [ ] Signed release process is defined.
* [ ] Auto-update works where supported.

---

# 18. Phase Dependencies

The major dependency chain is:

```text
Project Foundation
        ↓
Database
        ↓
IPC
        ↓
Asset Services
        ↓
Asset UI
        ↓
Organization/Search
        ↓
UX Polish
        ↓
──────── DEMO 1
        ↓
Sync Foundation
        ↓
Multi-Device Sync
        ↓
Conflict Resolution
        ↓
──────── DEMO 2
        ↓
Security
        ↓
Testing
        ↓
Packaging
```

Do not move a phase into production scope before its foundational dependency is stable enough.

---

# 19. Parallel Work

Some work can proceed in parallel once the architecture is established.

```text
                 ┌── Database tests
                 │
Database ────────┼── UI shell
                 │
                 └── Shared types

IPC ─────────────── Application services

Asset services ──── Asset UI

Search service ──── Search UI

Sync engine ─────── Sync UI

Security ────────── Testing
```

However, parallel development must continue to respect the architectural boundaries established in `ARCHITECTURE.md`.

---

# 20. Feature Completion Standard

A feature should not be considered complete simply because its UI exists.

A feature is complete when it has:

```text
UI
+
IPC
+
Application Service
+
Persistence
+
Validation
+
Error Handling
+
Tests
```

For sync-related features, add:

```text
Sync Operation
+
Retry Handling
+
Conflict Behavior
```

---

# 21. Recommended Demo Priorities

When time is limited, prioritize features in this order:

## Tier 1 — Must have

```text
Application shell
Asset CRUD
Persistence
Editor
Search
Favorites
Collections
Tags
Recent
Dark/light theme
```

## Tier 2 — Strong demo value

```text
Command palette
Keyboard shortcuts
Sync status UI
Device identity
Sync queue visibility
```

## Tier 3 — Full product demonstration

```text
Cross-device sync
Offline queue
Conflict resolution
Device management
```

## Tier 4 — Production readiness

```text
Security hardening
Automated test suite
Auto-update
Code signing
Telemetry
Advanced recovery
```

---

# 22. Definition of MVP

For LumoSync, the MVP should mean:

> A polished desktop application for storing, organizing, searching, and managing developer assets locally, with a local-first architecture prepared for cross-device synchronization.

The MVP does **not** require every production synchronization feature to be complete.

---

# 23. Definition of Demo Ready

The application is **Demo Ready 1** when a user can successfully demonstrate:

```text
1. Launch LumoSync
2. Create a code snippet
3. Edit it
4. Save it
5. Add tags
6. Add it to a collection
7. Favorite it
8. Search for it
9. Open it from Recent
10. Delete it
11. Restore it
12. Restart the application
13. Confirm everything persists
14. Demonstrate the local-first/sync status concept
```

---

# 24. Definition of Full Demo Ready

The application is **Demo Ready 2** when it can additionally demonstrate:

```text
1. Device A creates an asset
2. Device A saves locally
3. Device A synchronizes
4. Device B receives the asset
5. Device A goes offline
6. Device A edits the asset
7. The edit is queued locally
8. Device A reconnects
9. The change synchronizes
10. Concurrent edits produce a conflict
11. User resolves the conflict
12. Both devices converge on the resolved state
```

---

# 25. Build Rules

Throughout implementation:

### Rule 1 — Local operations first

Never introduce a remote dependency into normal CRUD operations unless explicitly required.

### Rule 2 — Keep the renderer thin

Business logic belongs outside React components.

### Rule 3 — Treat the database as authoritative locally

Do not create unnecessary duplicate persistent state.

### Rule 4 — Every mutation must have a recovery path

Especially for synchronization.

### Rule 5 — Avoid premature abstraction

Only introduce abstractions that solve a real current or near-term problem.

### Rule 6 — Keep the demo path clean

A feature that is technically impressive but difficult to demonstrate should not take priority over the core user journey.

---

# 26. Recommended Immediate Sequence

Given the current documentation set:

```text
PRD.md
TDD.md
UI-SPEC.md
DATABASE-SPEC.md
ARCHITECTURE.md
```

the next implementation sequence should be:

```text
1. Phase 0 — Project Foundation
2. Phase 1 — Database & Persistence
3. Phase 2 — IPC Architecture
4. Phase 3 — Core Asset Management
5. Phase 4 — Organization & Search
6. Phase 5 — Local-First UX & Polish
7. DEMO 1
8. IPC/SYNC refinement
9. Phase 6 — Sync Foundation
10. Phase 7 — Multi-Device Sync
11. Phase 8 — Conflict Resolution
12. DEMO 2
```

The remaining production documents can be completed alongside the relevant phases rather than blocking initial development.

---

# 27. Documentation Alignment

The implementation should continuously reference:

```text
PRD.md
    ↓
What are we building?

TDD.md
    ↓
What technical approach are we using?

UI-SPEC.md
    ↓
How should it look and behave?

ARCHITECTURE.md
    ↓
How are the systems and boundaries structured?

DATABASE-SPEC.md
    ↓
How is local data persisted?

IPC-SPEC.md
    ↓
How do renderer and main communicate?

SYNC-PROTOCOL.md
    ↓
How do devices exchange changes?

SECURITY-SPEC.md
    ↓
How are privileged capabilities protected?

TEST-PLAN.md
    ↓
How do we verify the implementation?
```

---

# 28. Final Build Strategy

The recommended LumoSync build strategy is:

```text
                    BUILD
                      │
                      ▼
             ┌─────────────────┐
             │ Local Foundation│
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ Asset Management│
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ Search & Organize│
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ UX & Polish     │
             └────────┬────────┘
                      │
                      ▼
                 DEMO 1
                      │
                      ▼
             ┌─────────────────┐
             │ Sync Foundation │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ Multi-Device    │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ Conflicts       │
             └────────┬────────┘
                      │
                      ▼
                 DEMO 2
                      │
                      ▼
             ┌─────────────────┐
             │ Harden & Release│
             └─────────────────┘
```

The critical strategy is **not to wait for synchronization to finish before having a demo**. The first demo should already prove LumoSync's strongest foundation: **fast, persistent, offline-capable local asset management**. Cross-device synchronization then becomes the second major demonstration rather than a prerequisite for showing progress.
