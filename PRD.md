# LumoSync

## Local-First Code & Asset Manager

**Product Type:** Cross-platform desktop application
**Status:** Product Definition / Pre-Development
**Primary Stack:** Electron, React, TypeScript, SQLite
**Target Platforms:** Windows, macOS, Linux

---

# 1. Product Overview

LumoSync is a local-first desktop application for developers to collect, organize, manage, and synchronize code snippets and reusable developer assets across multiple workstations.

The application prioritizes **local ownership and offline availability**. A user's data is stored locally on their machine first, allowing the application to remain fully usable without an internet connection. Synchronization is an additional capability that keeps selected data consistent across the user's trusted devices.

LumoSync is designed to solve a common developer problem: useful scripts, commands, snippets, configuration templates, notes, and small assets become scattered across machines, editors, folders, browser bookmarks, and messaging applications.

Instead of relying on a centralized cloud application as the primary source of truth, LumoSync maintains a local database and workspace on each device and synchronizes changes between trusted devices.

### Core Value Proposition

> **Your developer toolbox, available on every machine, even when you're offline.**

---

# 2. Problem Statement

Developers frequently reuse small pieces of knowledge and code:

* SQL queries
* shell commands
* Git commands
* API examples
* configuration templates
* code snippets
* regular expressions
* Docker commands
* scripts
* documentation fragments
* environment templates
* images and other small assets

These assets are commonly stored in inconsistent places:

* random folders
* IDE snippets
* text files
* browser bookmarks
* personal notes
* cloud storage
* chat history
* Git repositories

This creates several problems:

1. **Poor discoverability**
   Developers may remember having a useful snippet but not where it was stored.

2. **Duplication**
   The same snippet may exist in several locations and diverge over time.

3. **Device fragmentation**
   A useful asset on one workstation may not exist on another.

4. **Offline limitations**
   Cloud-first tools become less useful when the network is unavailable.

5. **Trust and privacy concerns**
   Developer assets may contain proprietary code, infrastructure details, or sensitive information.

6. **Weak organization**
   Developers need a lightweight way to categorize and search reusable assets without maintaining a complex knowledge-management system.

---

# 3. Product Goals

## Primary Goals

### G1 — Local-first storage

All user data should be stored locally and remain accessible without an internet connection.

### G2 — Cross-device synchronization

Users should be able to synchronize selected developer assets between trusted devices.

### G3 — Fast asset management

Users should be able to quickly create, search, edit, organize, copy, and reuse assets.

### G4 — Secure desktop architecture

The application should safely bridge the Electron renderer and native operating-system capabilities while protecting user data and credentials.

### G5 — Reliable synchronization

Synchronization should tolerate:

* temporary network loss
* application restarts
* partial synchronization
* conflicting edits
* device going offline for extended periods

### G6 — Developer-focused UX

The interface should feel like a focused developer utility rather than a general-purpose note-taking application.

---

# 4. Non-Goals

The initial product will **not** attempt to become:

* a full IDE
* a Git client
* a password manager
* a general cloud drive
* a project-management application
* a full documentation/wiki platform
* an arbitrary filesystem backup solution
* a general-purpose collaboration platform

The MVP should focus on **small, reusable developer assets and code snippets**.

---

# 5. Target Users

## Primary User

Individual software developers who work across multiple computers.

Examples:

* frontend developers
* backend developers
* full-stack developers
* DevOps engineers
* automation engineers
* software consultants
* technical freelancers

## Secondary Users

Developers who maintain multiple environments:

* work laptop + personal computer
* desktop + laptop
* office + home workstation
* development VM + host machine

---

# 6. Core Concepts

The application will organize information around several core entities.

## Asset

The fundamental unit stored by LumoSync.

Examples:

```text
Git Reset Last Commit
Docker Cleanup Command
PostgreSQL Backup Script
React Error Boundary
Apache Reverse Proxy Config
JWT Verification Example
Nginx Config
Useful SQL Query
```

An asset contains:

* title
* content
* asset type
* language / format
* tags
* description
* timestamps
* synchronization metadata

---

## Collection

A logical grouping of related assets.

Examples:

```text
React
Spring Boot
Docker
Linux
Git
Database
DevOps
Personal Utilities
Work
```

An asset can belong to one or more collections.

---

## Workspace

A local LumoSync installation containing:

* local database
* local asset store
* application configuration
* synchronization state
* registered device identity

---

## Device

A workstation registered to the user's LumoSync account.

Example:

```text
MacBook Pro
Windows Desktop
Linux Dev Machine
```

Each device has its own:

* device ID
* device name
* synchronization cursor/state
* authentication credentials

---

# 7. Supported Asset Types

## MVP

### Code Snippets

```text
JavaScript
TypeScript
Python
Java
SQL
Bash
CSS
HTML
JSON
XML
YAML
```

### Text Assets

* commands
* notes
* templates
* configuration examples
* documentation fragments

### File Assets

Small files may be attached to an asset.

Examples:

```text
.env.example
docker-compose.yml
nginx.conf
script.sh
schema.sql
```

### Future

Potential support for:

* images
* PDFs
* larger files
* folder-based assets
* VS Code snippet imports
* IDE integrations

---

# 8. MVP Feature Set

## 8.1 Asset Creation

Users can create assets from the application.

Required fields:

```text
Title
Content
Asset Type
Language / Format
Tags
Description
Collection
```

Example:

```text
Title:
Find Running Docker Containers

Type:
Command

Language:
Bash

Tags:
docker, cli

Content:
docker ps
```

The application should save the asset locally immediately.

---

# 8.2 Asset Editing

Users can:

* edit content
* change metadata
* add/remove tags
* move assets between collections
* duplicate assets
* delete assets

Changes should be persisted locally before any synchronization occurs.

---

# 8.3 Copy to Clipboard

Each asset should provide a prominent **Copy** action.

Optional future functionality:

* copy with formatting
* copy selected lines
* copy file
* keyboard shortcut

Example:

```text
Ctrl + C
```

or an application-specific shortcut when the asset view is focused.

---

# 8.4 Search

Search should be one of the application's primary interactions.

Users should be able to search:

* title
* content
* description
* tags
* language
* collection

Example:

```text
docker cleanup
```

should surface:

```text
Docker Cleanup
Remove Unused Images
Docker Disk Usage
Docker Compose Restart
```

The search system should support fast local queries using SQLite indexes.

---

# 8.5 Filtering

Users should be able to filter assets by:

```text
Collection
Asset Type
Language
Tags
Recently Updated
Recently Used
Favorites
```

---

# 8.6 Favorites

Users can mark frequently used assets as favorites.

Favorite assets should be accessible from a dedicated view.

---

# 8.7 Recently Used

LumoSync should track local usage such as:

* copied
* opened
* edited

Users should be able to quickly access recently used assets.

---

# 8.8 Collections

Users can:

* create collections
* rename collections
* delete collections
* assign assets
* move assets between collections

Example:

```text
My Library

├── Git
├── Docker
├── Linux
├── React
├── Java
├── SQL
└── Personal
```

---

# 8.9 Tags

Assets can have multiple tags.

Example:

```text
docker
linux
deployment
cleanup
```

Tags should provide another method of discovery.

---

# 8.10 Local-first Offline Mode

The application must remain fully usable without network connectivity.

The user should still be able to:

* create assets
* edit assets
* delete assets
* search assets
* copy assets
* manage collections
* manage tags

When connectivity returns, pending changes should automatically become eligible for synchronization.

---

# 9. Synchronization

Synchronization is the defining capability of LumoSync.

## 9.1 Synchronization Model

The architecture should follow:

```text
Local Device A
      │
      │
      ▼
Local SQLite
      │
      │ Sync
      ▼
Remote Sync Layer
      │
      │ Sync
      ▼
Local SQLite
      │
      ▼
Local Device B
```

The remote layer should act primarily as a **synchronization mechanism**, not as the primary application database from the user's perspective.

---

# 10. Sync Principles

### Principle 1 — Local changes happen first

A mutation should always be written locally before synchronization.

### Principle 2 — Offline changes are queued

When offline, the application records pending synchronization operations.

### Principle 3 — Synchronization is asynchronous

Synchronization should never block normal asset usage.

### Principle 4 — Synchronization is incremental

The application should synchronize only changed records rather than downloading the entire library.

### Principle 5 — Deletions must be synchronized safely

Deleting an asset locally should generate a synchronization event rather than simply removing all knowledge of it immediately.

---

# 11. Sync State

Each synchronized entity should maintain metadata similar to:

```text
id
created_at
updated_at
deleted_at
version
device_id
sync_status
last_synced_at
```

Example:

```text
sync_status:

SYNCED
PENDING
FAILED
CONFLICT
```

---

# 12. Conflict Resolution

Conflicts can occur when:

```text
Laptop modifies Asset A
       +
Desktop modifies Asset A
       ↓
Both synchronize later
```

The MVP should implement deterministic conflict handling.

### Recommended MVP Strategy

Use a **version + timestamp based conflict model** with conflict preservation.

For a conflicting asset:

1. Detect that both devices modified the same logical record.
2. Determine the winning version according to the synchronization rules.
3. Preserve the losing version temporarily.
4. Mark the asset as conflicted when human review is required.

The UX should avoid silently destroying user changes.

Example:

```text
Conflict Detected

"Git Deployment Command"

Current version
Last modified on Windows

Other version
Last modified on Mac

[Keep Current]
[Keep Other]
[View Differences]
```

A more sophisticated CRDT-style model may be considered later if collaborative editing becomes a requirement.

---

# 13. Sync Queue

Local mutations should generate synchronization jobs.

Example:

```text
Asset Created
       ↓
SQLite Transaction
       ↓
Sync Queue
       ↓
Network Available?
   ┌───────┴───────┐
   │               │
  NO              YES
   │               │
Queue         Send Changes
                   │
                   ▼
              Server ACK
                   │
                   ▼
             Mark Synced
```

The queue must survive:

* application restarts
* device shutdown
* temporary network failures

---

# 14. Retry Strategy

Failed synchronization attempts should retry automatically.

Recommended progression:

```text
Immediate retry
↓
Short delay
↓
Exponential backoff
↓
Maximum retry interval
```

Persistent failures should be surfaced to the user without repeatedly disrupting the application.

Example status:

```text
Sync paused

Last successful sync:
10 minutes ago

3 changes waiting to sync.
```

---

# 15. Authentication & Devices

Users should be able to sign into their LumoSync account and register trusted devices.

Example:

```text
Account
   │
   ├── Windows PC
   ├── MacBook
   └── Linux Workstation
```

Device management should support:

* device naming
* device registration
* device revocation
* last active timestamp
* sync status

---

# 16. Credential Security

Authentication tokens and sensitive credentials must **never be stored directly in the renderer process or plain application storage**.

Electron's native layer should interact with the operating system's secure credential storage.

Examples:

```text
Windows Credential Manager
macOS Keychain
Linux Secret Service / compatible credential store
```

The renderer should communicate with privileged functionality through controlled IPC interfaces.

---

# 17. Electron Security Model

The application should follow a secure Electron architecture.

### Renderer

Responsible for:

* UI
* React state
* user interactions

### Preload

Responsible for:

* exposing a minimal typed API
* controlled communication with the main process

### Main Process

Responsible for:

* filesystem access
* SQLite
* credential storage
* native APIs
* application lifecycle
* updater
* synchronization engine

Conceptually:

```text
┌───────────────────────────────┐
│           React UI            │
│          Renderer             │
└───────────────┬───────────────┘
                │
          Typed IPC API
                │
┌───────────────▼───────────────┐
│          Preload              │
│      Context Isolated         │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│        Electron Main          │
│                               │
│ Filesystem                    │
│ SQLite                        │
│ Secure Storage                │
│ Sync Engine                   │
│ Auto Updater                  │
└───────────────────────────────┘
```

The renderer should not have direct unrestricted access to Node.js APIs.

---

# 18. Local Database

SQLite is the primary persistence layer.

The database should contain entities such as:

```text
users
devices
assets
collections
tags
asset_tags
asset_collections
sync_operations
sync_state
conflicts
settings
```

Potential asset structure:

```text
assets

id
title
description
content
asset_type
language
created_at
updated_at
deleted_at
version
device_id
is_favorite
last_used_at
```

---

# 19. Local Asset Storage

SQLite should store structured metadata and smaller content directly.

Larger binary assets should be stored in the application-managed filesystem with metadata references stored in SQLite.

Example:

```text
LumoSync Data/
├── database.sqlite
├── assets/
│   ├── 8f/
│   │   └── asset-file
│   └── c2/
│       └── asset-file
├── cache/
└── logs/
```

The exact storage layout should be abstracted behind a repository/storage service.

---

# 20. Application Architecture

Recommended structure:

```text
Electron
│
├── Main Process
│   ├── IPC
│   ├── Database
│   ├── File Storage
│   ├── Credentials
│   ├── Sync Engine
│   ├── Updater
│   └── OS Integration
│
├── Preload
│   └── Typed API Bridge
│
└── Renderer
    ├── React
    ├── UI
    ├── State Management
    ├── Search
    └── Feature Modules
```

A clean application/domain separation should be maintained so that synchronization logic does not become tightly coupled to React or Electron APIs.

---

# 21. Recommended Application Layers

## Presentation Layer

React components and UI state.

```text
AssetList
AssetEditor
AssetViewer
Search
Collections
Settings
SyncStatus
```

## Application Layer

Use cases such as:

```text
CreateAsset
UpdateAsset
DeleteAsset
SearchAssets
CopyAsset
CreateCollection
SyncAssets
ResolveConflict
RegisterDevice
```

## Domain Layer

Core domain rules:

```text
Asset
Collection
Tag
SyncOperation
Conflict
Device
```

## Infrastructure Layer

Implementation details:

```text
SQLite Repository
Filesystem Repository
Credential Store
IPC Adapter
Sync API Client
Updater
```

---

# 22. UI Structure

The initial application can use a three-region layout.

```text
┌──────────────────────────────────────────────────────────┐
│ LumoSync                              Search       User  │
├───────────────┬──────────────────────────────┬───────────┤
│               │                              │           │
│ Collections   │        Asset List            │  Asset    │
│               │                              │  Details  │
│ All Assets    │  ┌────────────────────────┐  │           │
│ Favorites     │  │ Docker Cleanup         │  │ Title     │
│ Recent        │  │ Bash                   │  │ Tags      │
│               │  └────────────────────────┘  │ Content   │
│ Git           │                              │           │
│ Docker        │                              │ Copy      │
│ React         │                              │ Edit      │
│ Linux         │                              │           │
│               │                              │           │
└───────────────┴──────────────────────────────┴───────────┘
```

---

# 23. Primary Navigation

Suggested navigation:

```text
Library
Favorites
Recent
Collections
Tags
Conflicts
Sync
Settings
```

The main library should remain the primary screen.

---

# 24. Global Search

Search should be immediately accessible.

Preferred behavior:

```text
Ctrl/Cmd + K
```

opens global search.

Example:

```text
Search assets...

> nginx proxy
```

Results should appear immediately without requiring server communication.

---

# 25. Sync Status UX

Synchronization should remain visible but unobtrusive.

Example states:

```text
✓ Synced
↻ Syncing...
⚠ 2 changes pending
! Sync error
```

The user should be able to open a detailed synchronization panel showing:

```text
Last sync
Pending changes
Failed operations
Conflicts
Device status
```

---

# 26. Import & Export

MVP should support basic import/export.

### Import

Potential sources:

```text
JSON
Markdown
Plain Text
```

Future integrations:

```text
VS Code snippets
Git repositories
Raycast snippets
Warp
Clipboard managers
```

### Export

Users should be able to export their library.

Example:

```text
Export Library

JSON
Markdown
ZIP
```

This ensures users can leave the application without being locked into the system.

---

# 27. Auto Updates

The application should support automatic updates.

Update flow:

```text
Application starts
      ↓
Check update channel
      ↓
Update available?
   ┌──────┴──────┐
   │             │
  NO            YES
   │             │
Continue     Download
                 │
                 ▼
             Install
                 │
                 ▼
              Restart
```

The updater should not interfere with unsynchronized local changes.

Before updating, the application should ensure local database operations are safely committed.

---

# 28. Logging & Diagnostics

The application should maintain structured logs for:

* application startup
* database errors
* synchronization failures
* IPC failures
* updater events
* authentication failures

Logs should help with troubleshooting without exposing secret credentials or asset contents unnecessarily.

---

# 29. Error Handling

Errors should be categorized.

### User-facing errors

Examples:

```text
Unable to save asset.
Unable to connect to sync service.
Sync requires authentication.
```

### Recoverable errors

Examples:

```text
Network unavailable
Temporary sync failure
Updater unavailable
```

### Critical errors

Examples:

```text
Database corruption
Migration failure
Application initialization failure
```

Critical errors should provide recovery options where possible.

---

# 30. Privacy & Security Requirements

LumoSync may contain proprietary developer information, so security is a first-class requirement.

The application must:

* protect authentication credentials
* minimize renderer privileges
* isolate Electron contexts
* validate IPC input
* avoid arbitrary filesystem access from the renderer
* avoid storing credentials in plaintext
* prevent accidental logging of secrets
* authenticate synchronization requests
* revoke compromised devices
* protect synchronized data in transit

### Recommended Future Enhancement

Client-side encryption of synchronized asset content so that the remote synchronization layer cannot directly inspect user data.

---

# 31. Performance Requirements

LumoSync should feel instant for normal developer workflows.

Target expectations:

| Operation            |                            Target |
| -------------------- | --------------------------------: |
| Application startup  |   < 2 seconds on typical hardware |
| Local asset creation |       < 100 ms perceived response |
| Search               | Near-instant for normal libraries |
| Asset retrieval      |       < 100 ms perceived response |
| Copy to clipboard    |                         Immediate |
| Local mutation       |             No network dependency |
| Sync startup         |         Background / non-blocking |

The application should remain responsive while synchronization is running.

---

# 32. Reliability Requirements

The application must preserve local data through:

* application crashes
* system restarts
* network interruptions
* partial synchronization
* application upgrades

Database writes should use appropriate transactions.

Synchronization operations should be idempotent where practical so retrying an operation does not create duplicate data.

---

# 33. Functional Requirements

## Asset Management

**FR-001**
Users can create developer assets.

**FR-002**
Users can edit assets.

**FR-003**
Users can delete assets.

**FR-004**
Users can duplicate assets.

**FR-005**
Users can favorite assets.

**FR-006**
Users can copy asset content to the clipboard.

---

## Organization

**FR-007**
Users can create collections.

**FR-008**
Users can assign assets to collections.

**FR-009**
Users can assign multiple tags to assets.

**FR-010**
Users can filter by metadata.

---

## Search

**FR-011**
Users can search local assets.

**FR-012**
Search results should update quickly as the user types.

**FR-013**
Search should operate without an internet connection.

---

## Synchronization

**FR-014**
Users can authenticate a device.

**FR-015**
Users can enable synchronization.

**FR-016**
Local changes are queued when offline.

**FR-017**
Queued changes synchronize when connectivity returns.

**FR-018**
Synchronization resumes after application restart.

**FR-019**
The application detects synchronization conflicts.

**FR-020**
Users can resolve conflicts.

---

## Device Management

**FR-021**
Users can view registered devices.

**FR-022**
Users can rename devices.

**FR-023**
Users can revoke a device.

---

## Security

**FR-024**
Credentials are stored using secure operating-system credential storage.

**FR-025**
Renderer code cannot directly access privileged Node.js functionality.

**FR-026**
IPC APIs validate input.

---

## Updates

**FR-027**
The application can detect available updates.

**FR-028**
The application can download and install updates.

---

# 34. Non-Functional Requirements

## Security

* Context isolation enabled
* No unnecessary Node integration in renderer
* Controlled IPC API
* Secure credential storage
* HTTPS/TLS for remote communication
* No credentials in source code
* No sensitive data in logs

## Reliability

* SQLite transaction safety
* Persistent sync queue
* Retryable synchronization
* Crash-safe local storage

## Maintainability

* TypeScript across application code
* Clear domain/application/infrastructure boundaries
* Typed IPC contracts
* Automated tests
* Database migration system

## Cross-platform

The application should behave consistently on:

```text
Windows
macOS
Linux
```

OS-specific functionality should be isolated behind platform abstractions.

---

# 35. Testing Strategy

## Unit Tests

Test:

* domain rules
* asset operations
* search
* sync state transitions
* conflict detection
* retry behavior

## Integration Tests

Test:

* SQLite repository
* filesystem storage
* IPC communication
* credential storage
* synchronization API

## End-to-End Tests

Test workflows such as:

```text
Create asset
↓
Edit asset
↓
Close application
↓
Restart
↓
Verify asset
```

And:

```text
Device A
Create asset
↓
Sync
↓
Device B
Sync
↓
Verify asset
```

Conflict scenario:

```text
Device A edits asset
+
Device B edits same asset
↓
Both synchronize
↓
Conflict detected
↓
User resolves
```

---

# 36. MVP Scope

The first production-ready version should include:

### Library

* asset creation
* asset editing
* asset deletion
* collections
* tags
* favorites
* recent assets
* search
* filtering
* clipboard copy

### Local-first

* SQLite
* offline operation
* persistent local data
* migration system

### Sync

* account authentication
* device registration
* asset synchronization
* sync queue
* retries
* conflict detection
* basic conflict resolution

### Desktop

* secure IPC
* filesystem bridge
* secure credential storage
* application settings
* auto updates

### Developer Experience

* keyboard shortcuts
* syntax highlighting
* import/export
* responsive interface
* fast startup

---

# 37. Post-MVP Features

Potential future capabilities:

## IDE Integrations

```text
VS Code
JetBrains
Neovim
Visual Studio
```

## CLI

```bash
lumosync add
lumosync search
lumosync copy
lumosync sync
```

Example:

```bash
lumosync search "docker cleanup"
```

---

## Browser Extension

Save code directly from:

* GitHub
* Stack Overflow
* documentation
* web articles

---

## Smart Features

AI-powered:

* automatic tagging
* snippet summarization
* duplicate detection
* semantic search
* related asset recommendations
* natural-language search

Example:

```text
"Show me the nginx config I use for a reverse proxy"
```

---

## Developer Workflow Integrations

Potential integrations with:

* clipboard managers
* terminal applications
* Raycast
* Alfred
* VS Code
* GitHub

---

# 38. Suggested Technical Architecture

```text
                     ┌──────────────────────┐
                     │      Sync Backend    │
                     │                      │
                     │ Auth                 │
                     │ Sync API             │
                     │ Device Registry      │
                     └──────────┬───────────┘
                                │
                         HTTPS / API
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
┌───────▼────────┐                             ┌────────▼───────┐
│   Workstation  │                             │   Workstation  │
│       A        │                             │       B        │
│                │                             │                │
│ React Renderer │                             │ React Renderer │
│       │        │                             │       │        │
│    Preload     │                             │    Preload     │
│       │        │                             │       │        │
│ Electron Main  │                             │ Electron Main  │
│       │        │                             │       │        │
│ SQLite         │                             │ SQLite         │
│ File Store     │                             │ File Store     │
│ Sync Engine    │                             │ Sync Engine    │
│ Secure Store   │                             │ Secure Store   │
└────────────────┘                             └────────────────┘
```

---

# 39. Recommended Backend Responsibility

The backend should remain intentionally small.

It should primarily provide:

```text
Authentication
Device registration
Synchronization
Change/version tracking
Conflict coordination
```

The backend should not become the application's primary source of truth for ordinary local interactions.

This preserves the local-first philosophy and keeps the desktop application functional during network outages.

---

# 40. Suggested Development Phases

## Phase 1 — Desktop Foundation

Build:

* Electron shell
* React application
* TypeScript configuration
* secure preload bridge
* application layout
* routing
* settings infrastructure

### Deliverable

A secure cross-platform desktop shell.

---

## Phase 2 — Local Asset System

Build:

* SQLite schema
* migrations
* repositories
* asset CRUD
* collections
* tags
* favorites
* local search

### Deliverable

Fully functional offline asset manager.

---

## Phase 3 — Developer UX

Build:

* syntax highlighting
* command palette
* keyboard shortcuts
* quick copy
* recent assets
* improved search
* import/export

### Deliverable

A genuinely useful standalone developer tool before synchronization exists.

---

## Phase 4 — Authentication & Devices

Build:

* account authentication
* device identity
* secure credential storage
* device registration
* device management

### Deliverable

Trusted devices can be registered securely.

---

## Phase 5 — Synchronization Engine

Build:

* sync queue
* remote change retrieval
* push operations
* retry handling
* sync state
* offline queue
* conflict detection

### Deliverable

Two devices can reliably synchronize changes.

---

## Phase 6 — Conflict Resolution

Build:

* conflict UI
* version comparison
* keep-current
* keep-remote
* merge workflow where practical

### Deliverable

Conflicting changes can be safely resolved without silent data loss.

---

## Phase 7 — Auto Updates & Distribution

Build:

* platform packaging
* signing
* update channels
* automatic updates
* crash-safe update behavior

### Deliverable

Installable production builds for Windows, macOS, and Linux.

---

# 41. MVP Success Criteria

The MVP is considered successful when a developer can:

### Scenario 1 — Create

```text
Open LumoSync
↓
Create Docker snippet
↓
Close application
↓
Reopen
↓
Snippet still exists
```

### Scenario 2 — Offline

```text
Disconnect internet
↓
Create/edit assets
↓
Search library
↓
Copy snippets
↓
Reconnect
↓
Changes synchronize
```

### Scenario 3 — Multi-device

```text
Device A
Create asset
↓
Sync
↓
Device B
Open LumoSync
↓
Sync
↓
Asset appears
```

### Scenario 4 — Conflict

```text
Device A edits asset
+
Device B edits same asset
↓
Both reconnect
↓
Conflict detected
↓
User chooses desired version
↓
Both devices converge
```

### Scenario 5 — Security

```text
Renderer
   ↓
IPC
   ↓
Main Process
   ↓
Secure Credential Store
```

No privileged native functionality should be unnecessarily exposed to the renderer.

---

# 42. Product Principles

LumoSync should follow five principles throughout development:

### Local First

The application must remain useful without the cloud.

### Fast

Common actions should require minimal interaction.

### Developer Native

The UX should feel natural to developers who live in terminals, editors, and command palettes.

### Secure by Default

Native capabilities and credentials should be protected from unnecessary exposure.

### Never Lose My Work

Synchronization should prioritize data integrity over aggressive merging or silent overwrites.

---

# 43. One-Sentence Product Definition

> **LumoSync is a local-first developer asset manager that lets developers securely organize, search, and synchronize reusable code, commands, configurations, and other development assets across their workstations.**
