# LumoSync

## UI Specification

**Document Version:** 1.0
**Status:** Proposed
**Product:** LumoSync — Local-First Code & Asset Manager
**Platform:** Desktop — Windows, macOS, Linux
**UI Framework:** React + TypeScript
**Component System:** shadcn/ui
**Styling:** Tailwind CSS
**Design Direction:** Spacious, developer-focused, modern SaaS utility

---

# 1. UI Design Vision

LumoSync should feel like a **professional developer tool**, not a generic note-taking application.

The interface should communicate:

> **Fast. Organized. Local. Technical. Trustworthy.**

The application should prioritize the user's library and make the most common actions—searching, opening, copying, and editing assets—extremely fast.

The UI should remain visually quiet so that code and developer content receive most of the attention.

---

# 2. Design Principles

## 2.1 Content First

The asset itself is the primary visual focus.

UI controls should support the content rather than compete with it.

---

## 2.2 Spacious, Not Empty

Use generous spacing around major sections while maintaining high information density within asset lists.

The application should feel:

```text
comfortable
    ↓
structured
    ↓
efficient
```

rather than:

```text
crowded
```

or:

```text
excessively empty
```

---

## 2.3 Instant Feedback

Actions should produce immediate local feedback.

Examples:

```text
Save
  ↓
Saved

Copy
  ↓
Copied

Favorite
  ↓
Favorited

Sync
  ↓
Syncing...
```

The UI should never make a local operation appear to be waiting on the network.

---

## 2.4 Progressive Disclosure

Secondary information should remain hidden until useful.

For example:

```text
Asset Card
────────────
Title
Language
Short description
Tags

          More →
```

Detailed metadata appears in the asset panel.

---

## 2.5 Developer-Native Interaction

Keyboard shortcuts and command-driven navigation are first-class features.

The application should work well with:

* mouse
* keyboard
* command palette
* global search

---

## 2.6 Trust Through Visibility

Synchronization should be visible but not intrusive.

A user should always be able to answer:

> "Are my changes safely stored?"

and:

> "When was this device last synchronized?"

---

# 3. Visual Identity

LumoSync should have its own visual identity rather than looking like a default shadcn application.

The design language should combine:

* modern SaaS application structure
* developer-tool typography
* subtle borders
* restrained surfaces
* technical/editorial details
* compact controls
* high-quality code presentation

Avoid excessive:

* gradients
* glassmorphism
* shadows
* rounded cards everywhere
* decorative illustrations
* animation for animation's sake

---

# 4. Theme Strategy

LumoSync should support:

```text
Light
Dark
System
```

The initial product should ship with both light and dark themes.

---

# 5. Color System

The UI should use semantic design tokens rather than hardcoded colors.

## 5.1 Light Theme

```text id="d2qcr4"
Background
#F8FAFC

Surface
#FFFFFF

Surface Muted
#F1F5F9

Border
#E2E8F0

Border Strong
#CBD5E1

Text Primary
#0F172A

Text Secondary
#475569

Text Muted
#64748B

Primary
#2563EB

Primary Hover
#1D4ED8

Success
#16A34A

Warning
#D97706

Danger
#DC2626

Info
#0284C7
```

---

## 5.2 Dark Theme

```text id="j1h9h5"
Background
#0B0F14

Surface
#111827

Surface Elevated
#172033

Surface Muted
#1A2230

Border
#253044

Border Strong
#334155

Text Primary
#F8FAFC

Text Secondary
#CBD5E1

Text Muted
#94A3B8

Primary
#60A5FA

Primary Hover
#93C5FD

Success
#4ADE80

Warning
#FBBF24

Danger
#F87171

Info
#38BDF8
```

The exact palette may be adjusted during implementation, but the semantic roles should remain stable.

---

# 6. Color Usage Rules

Primary color should be used for:

* primary actions
* active navigation
* focus indicators
* selected states
* important interactive elements

It should not dominate the entire interface.

Status colors should communicate meaning:

```text
Green  = healthy / synced / success
Amber  = attention / pending
Red    = error / conflict
Blue   = information / active operation
```

Avoid using red, green, or amber purely as decoration.

---

# 7. Typography

## Primary UI Font

Use:

```text
Inter
```

or an equivalent high-quality sans-serif.

---

## Code Font

Use:

```text
JetBrains Mono
```

or equivalent monospace font.

---

## Type Scale

```text id="5h0gvw"
Display
28px / 34px

Page Heading
22px / 28px

Section Heading
16px / 24px

Body
14px / 20px

Small
13px / 18px

Caption
12px / 16px

Code
13px / 20px
```

---

# 8. Typography Weight

```text id="hhq8nk"
Regular
400

Medium
500

Semibold
600

Bold
700
```

The application should favor `400–600`.

Use bold sparingly.

---

# 9. Spacing System

Use a consistent 4px base scale.

```text
4
8
12
16
20
24
32
40
48
64
```

Recommended major layout spacing:

```text
Page padding: 24px
Section spacing: 24–32px
Card padding: 16–20px
Control gaps: 8–12px
Inline icon gap: 6–8px
```

---

# 10. Border Radius

Use relatively restrained rounding.

```text
xs    4px
sm    6px
md    8px
lg    10px
xl    12px
```

Preferred:

```text
Buttons        8px
Inputs         8px
Cards          10px
Dialog         12px
Code blocks    8px
```

Avoid pill-shaped UI except for:

* tags
* status indicators
* compact filters

---

# 11. Shadows

Shadows should be subtle.

Primary use:

* dialogs
* menus
* command palette
* floating panels

Cards should primarily use:

```text
border
```

rather than a visible drop shadow.

---

# 12. Iconography

Use:

```text
Lucide Icons
```

Icons should be:

* simple
* consistent
* 16–20px in normal controls
* 20–24px in major empty states

Do not use icons without adequate contextual meaning.

Icon-only controls must include tooltips.

---

# 13. Application Shell

The desktop application uses a persistent shell.

```text id="31i0c6"
┌───────────────────────────────────────────────────────────────────┐
│ App Header                                                        │
├───────────────┬───────────────────────────────────────────────────┤
│               │                                                   │
│               │                                                   │
│   Sidebar     │               Main Workspace                      │
│               │                                                   │
│               │                                                   │
│               │                                                   │
├───────────────┴───────────────────────────────────────────────────┤
│ Optional status / sync area                                      │
└───────────────────────────────────────────────────────────────────┘
```

The shell should remain consistent across the majority of screens.

---

# 14. Global Layout

Recommended desktop dimensions:

```text
Sidebar
240px

Main workspace
flexible

Minimum app width
1024px

Preferred app width
1280px+

Page padding
24px
```

The interface should remain usable down to approximately 1024px without requiring horizontal scrolling.

---

# 15. Sidebar

The sidebar is the primary navigation structure.

```text
LumoSync

+ New Asset

Library
  All Assets
  Favorites
  Recent

Collections
  Git
  Docker
  React
  Linux
  Java

Tags

Workspace
  Conflicts
  Sync

Settings
```

---

# 16. Sidebar Header

The top area contains:

```text
LumoSync logo
Application name
Collapse button
```

Collapsed state:

```text
┌─────┐
│  L  │
│  +  │
│  ◉  │
│  ★  │
│  ↻  │
│  ⚙  │
└─────┘
```

---

# 17. Sidebar Behavior

The sidebar supports:

* expand
* collapse
* persistent user preference
* keyboard navigation
* collection expansion
* active state indication

When collapsed, tooltips are mandatory.

---

# 18. Primary Sidebar Actions

## New Asset

Prominent button near the top.

```text
┌──────────────────────┐
│  +  New Asset        │
└──────────────────────┘
```

Shortcut:

```text
Ctrl/Cmd + N
```

---

# 19. Navigation Active State

The active navigation item should use:

```text
subtle filled background
+
primary icon
+
primary text
```

Avoid strong outlines around active navigation items.

---

# 20. Sidebar Collection List

Collections should support:

```text
Collection Name        24
```

where the number indicates the number of assets.

Hover reveals:

```text
•••
```

with:

```text
Rename
Delete
Add Asset
```

---

# 21. Main Library Screen

The Library is the primary application screen.

```text id="q1ay3f"
┌───────────────────────────────────────────────────────────────┐
│ All Assets                                      + New Asset    │
│ Manage your developer toolbox                                 │
│                                                               │
│ [ Search assets...                       ] [Filter] [Sort]     │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Docker Cleanup                                  Bash       │ │
│ │ Remove unused Docker resources                            │ │
│ │ docker • cleanup • cli                        ★           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ JWT Validation Example                         TypeScript  │ │
│ │ Token verification middleware                             │ │
│ │ auth • jwt • backend                                      │ │
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

# 22. Page Header

Each major page should use:

```text
Eyebrow / optional context

Heading

Short contextual description

Primary action
```

Example:

```text
LIBRARY

All Assets
Everything you've saved in LumoSync.

[+ New Asset]
```

Descriptions should remain concise.

---

# 23. Search Bar

Search should be one of the most visually prominent controls.

```text
┌──────────────────────────────────────────────────────┐
│  ⌕  Search assets...                           ⌘ K  │
└──────────────────────────────────────────────────────┘
```

Features:

* keyboard shortcut hint
* clear button when active
* focus state
* instant local search
* search result count

---

# 24. Search Interaction

Typing:

```text
docker
```

should immediately update the asset list.

No search button should be required.

---

# 25. Search Result Categories

Search may group results by:

```text
Assets
Collections
Tags
```

Example:

```text
Assets

Docker Cleanup
Docker Compose Restart
Docker Disk Cleanup

Collections

Docker

Tags

docker
```

---

# 26. Filter Bar

Default filters:

```text
All
Code
Commands
Config
Notes
Templates
```

Additional filtering:

```text
Language
Collection
Tag
Favorite
Recently Used
```

Advanced filters can be placed inside a popover.

---

# 27. Sorting

Default:

```text
Recently Updated
```

Options:

```text
Recently Updated
Recently Created
Recently Used
Name A–Z
Name Z–A
```

---

# 28. Asset List

The primary list should be visually lightweight.

Each item contains:

```text
Title
Type / Language
Description
Tags
Favorite
Updated time
```

Example:

```text
Docker Cleanup
Bash · Command

Remove unused Docker images, containers and volumes.

docker   cli   cleanup

Updated 2 hours ago                       ★
```

---

# 29. Asset Row Interaction

Click:

```text
opens asset
```

Double click:

```text
opens asset editor
```

Right click:

```text
Copy
Edit
Duplicate
Favorite
Move to Collection
Delete
```

---

# 30. Asset Selection

Selected rows should have:

```text
subtle primary-tinted background
```

Selection should never make the entire row visually heavy.

---

# 31. Asset Detail Panel

The preferred desktop interaction is a split workspace.

```text
┌──────────────────────┬───────────────────────────────────────┐
│ Asset List           │ Asset Details                         │
│                      │                                       │
│ Docker Cleanup       │ Docker Cleanup                        │
│ JWT Example          │ Bash · Command                       │
│ Nginx Proxy          │                                       │
│                      │ Remove unused resources.              │
│                      │                                       │
│                      │ ┌───────────────────────────────────┐ │
│                      │ │ docker system prune -a             │ │
│                      │ │                                    │ │
│                      │ └───────────────────────────────────┘ │
│                      │                                       │
│                      │ [Copy] [Edit] [Favorite]              │
└──────────────────────┴───────────────────────────────────────┘
```

---

# 32. Asset Detail Header

Header layout:

```text
Back / breadcrumb

Title                            More
Type · Language

Description
Tags
```

Primary action:

```text
Copy
```

Secondary actions:

```text
Edit
Favorite
More
```

---

# 33. Code Presentation

Code content should use:

* syntax highlighting
* line numbers where useful
* monospace typography
* horizontal scrolling
* copy button
* language label

Example:

```text
┌──────────────────────────────────────────────────────┐
│ Bash                                      Copy       │
├──────────────────────────────────────────────────────┤
│ 1  docker system prune -a                            │
│ 2  docker volume prune                               │
│ 3  docker network prune                              │
└──────────────────────────────────────────────────────┘
```

---

# 34. Code Copy Feedback

When Copy is clicked:

```text
Copy
```

becomes temporarily:

```text
✓ Copied
```

Then returns to:

```text
Copy
```

No modal should appear.

---

# 35. Asset Editor

The editor should optimize for writing code, not form completion.

```text
┌───────────────────────────────────────────────────────────────┐
│ Edit Asset                                      Cancel  Save   │
├───────────────────────────────────────────────────────────────┤
│ Title                                                         │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Docker Cleanup                                             │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ Type              Language                                   │
│ [Command ▼]       [Bash ▼]                                   │
│                                                               │
│ Description                                                   │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Remove unused Docker resources.                            │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ Content                                                       │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ docker system prune -a                                     │ │
│ │                                                           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ Tags                                                         │
│ [docker] [cleanup] [+ Add tag]                               │
└───────────────────────────────────────────────────────────────┘
```

---

# 36. Editor Rules

The editor must:

* autosize appropriately
* support keyboard navigation
* preserve whitespace
* preserve indentation
* highlight syntax
* indicate unsaved changes
* support tab/indent handling
* prevent accidental navigation when unsaved changes exist

---

# 37. Unsaved Changes State

When the editor is dirty:

```text
Docker Cleanup • Unsaved
```

Closing the editor shows:

```text
Discard changes?

Your changes haven't been saved.

[Cancel] [Discard]
```

Save should always be the primary action.

---

# 38. New Asset Flow

The New Asset action should open the editor with sensible defaults.

Default:

```text
Type:
Code

Language:
Auto Detect
```

The title field receives focus immediately.

Shortcut:

```text
Ctrl/Cmd + N
```

---

# 39. Quick Create

Future enhancement:

A lightweight quick-create interface from anywhere.

```text
Create Asset

Title
Content

[Save]
```

Advanced metadata can be added afterward.

---

# 40. Collections Screen

Collections should display as a visual but restrained grid.

```text
Collections

┌────────────────────┐  ┌────────────────────┐
│ Git                │  │ Docker             │
│ 24 assets          │  │ 18 assets           │
│ Updated today      │  │ Updated yesterday   │
└────────────────────┘  └────────────────────┘

┌────────────────────┐  ┌────────────────────┐
│ React              │  │ Backend            │
│ 32 assets          │  │ 14 assets           │
└────────────────────┘  └────────────────────┘
```

---

# 41. Collection Detail

Selecting a collection returns to the standard asset list, filtered to that collection.

Header:

```text
COLLECTION

Docker

18 assets

[Edit Collection]
```

---

# 42. Tags

Tags should be compact and visually distinct.

Example:

```text
docker  cleanup  deployment
```

Tags use subtle tinted surfaces rather than bright colors.

---

# 43. Favorites

Favorites should provide a focused list.

Empty state:

```text
No favorites yet

Star assets you use often and they'll appear here.

[Browse Assets]
```

---

# 44. Recent

Recent should prioritize speed.

Sections:

```text
Today
Yesterday
Earlier this week
Older
```

Recent activity is local and should not require synchronization.

---

# 45. Empty States

Empty states should explain:

1. what happened
2. what the user can do
3. the primary action

Example:

```text
No assets yet

Start building your developer toolbox.

[Create Your First Asset]
```

Avoid generic:

```text
No data found
```

---

# 46. Search Empty State

```text
No assets found

Try another search term or remove a filter.

[Clear Search]
```

---

# 47. Collection Empty State

```text
No assets in this collection

Move an existing asset here or create a new one.

[New Asset]
```

---

# 48. Sync Screen

The Sync screen should make synchronization understandable without overwhelming users.

```text
Sync

Your devices stay up to date automatically.

Status
────────────────────────────────

✓ Synced

Last sync
2 minutes ago

Pending
0 changes

Devices
2 connected

────────────────────────────────

Windows Desktop                    ✓
MacBook Pro                        ✓

[Sync Now]
```

---

# 49. Sync Status Banner

Use a compact status component in the global shell.

### Synced

```text
✓ Synced
```

### Syncing

```text
↻ Syncing...
```

### Pending

```text
● 3 pending
```

### Conflict

```text
! 1 conflict
```

### Error

```text
! Sync error
```

Clicking the indicator opens the Sync panel.

---

# 50. Offline Indicator

When the internet is unavailable:

```text
Offline
```

should appear near synchronization status.

Example:

```text
● Offline · Local changes are safe
```

This is intentionally reassuring.

The application should communicate:

> local functionality continues to work.

---

# 51. Sync Progress

For normal synchronization, avoid intrusive progress bars.

Prefer:

```text
↻ Syncing...
```

A detailed progress indicator can appear in the Sync panel.

---

# 52. Sync Error State

```text
Synchronization paused

We couldn't reach the sync service.

Your local changes are safe.

Last successful sync:
10:42 AM

[Try Again]
```

Do not use alarming language for ordinary connectivity failures.

---

# 53. Conflict Screen

Conflicts require stronger visual emphasis.

```text
Conflicts

1 asset needs your attention.

┌──────────────────────────────────────────────────────┐
│ Docker Cleanup                                       │
│ Changed on two devices.                              │
│                                                      │
│ Windows                         MacBook               │
│ docker prune                    docker system prune  │
│                                                      │
│ [Compare Changes]                                    │
│                                                      │
│ [Keep Windows] [Keep MacBook] [Merge]                │
└──────────────────────────────────────────────────────┘
```

---

# 54. Conflict Detail

Use a side-by-side diff where possible.

```text
LOCAL                                REMOTE

docker system prune                 docker system prune -a

docker volume prune                 docker volume prune
```

Add clear version/device metadata:

```text
Windows Desktop
Updated 4 minutes ago

MacBook Pro
Updated 2 minutes ago
```

---

# 55. Conflict Resolution Principle

The UI must never make the user wonder:

> "Which version am I about to overwrite?"

Every conflict action should clearly identify:

```text
Keep Local
Keep Remote
Merge
```

---

# 56. Device Management

The Devices section should show:

```text
Windows Desktop
This device
Last synced 1 minute ago
Online

MacBook Pro
Last synced 20 minutes ago
Offline
```

Actions:

```text
Rename
Revoke
```

---

# 57. This Device Indicator

The current device should have:

```text
This device
```

rather than relying only on platform icons.

---

# 58. Revoke Device Dialog

```text
Revoke MacBook Pro?

This device will no longer be able to synchronize.

Its local data will remain on the device.

[Cancel] [Revoke Device]
```

The destructive action should use the danger styling.

---

# 59. Settings

Recommended categories:

```text
General
Appearance
Sync
Keyboard
Storage
Account
Devices
About
```

---

# 60. General Settings

```text
Launch at startup
[ On ]

Keep application running in background
[ Off ]

Confirm before deleting
[ On ]
```

---

# 61. Appearance Settings

```text
Theme

○ Light
○ Dark
○ System
```

Editor:

```text
Editor Font Size
[ 13 px ]

Line Numbers
[ On ]

Word Wrap
[ Off ]
```

---

# 62. Sync Settings

```text
Automatic synchronization
[ On ]

Sync interval
[ 5 minutes ]

Sync on startup
[ On ]
```

Show:

```text
Last successful sync
Current device
Account
```

---

# 63. Storage Settings

Display:

```text
Local library
18.3 MB

Database
4.2 MB

Attachments
14.1 MB
```

Actions:

```text
Open Data Folder
Export Library
Clear Local Cache
```

Destructive operations require confirmation.

---

# 64. Account Settings

Show:

```text
Account
user@example.com

Signed in

[Sign Out]
```

The actual implementation should avoid unnecessarily exposing credentials.

---

# 65. About Screen

Include:

```text
LumoSync
Version 1.0.0

Local-first developer asset management.

[Check for Updates]

© LumoSync
```

Also include:

```text
Open Source Licenses
Privacy
Terms
```

where applicable.

---

# 66. Command Palette

The command palette should feel like a core product feature.

```text
┌──────────────────────────────────────────────┐
│ ⌕  Search commands...                        │
├──────────────────────────────────────────────┤
│                                              │
│ + New Asset                                  │
│ ⌕ Search Assets                              │
│ ★ Open Favorites                             │
│ ↻ Sync Now                                   │
│ ⚠ View Conflicts                             │
│ ⚙ Open Settings                              │
│                                              │
└──────────────────────────────────────────────┘
```

Shortcut:

```text
Ctrl/Cmd + K
```

---

# 67. Command Palette Grouping

Commands can be grouped:

```text
Create
Navigate
Asset
Sync
Application
```

The search should support fuzzy matching.

---

# 68. Context Menus

Context menus should expose secondary operations.

Asset:

```text
Copy
Open
Edit
Duplicate
Add to Collection
Favorite
Delete
```

Collection:

```text
Open
Rename
Delete
```

Tag:

```text
Filter by Tag
Rename
```

---

# 69. Toast Notifications

Use toasts for lightweight feedback.

Examples:

```text
Asset saved
✓

Copied to clipboard
✓

Export completed
✓
```

For errors:

```text
Unable to save asset
[Retry]
```

Toasts should not contain information that is important enough to require persistent display.

---

# 70. Dialogs

Dialogs should be used for:

* destructive confirmation
* conflict resolution
* important account actions
* structured creation flows

Avoid dialog-based editing when the action can happen inline.

---

# 71. Loading States

Prefer skeletons for initial data loading.

Example:

```text
Title ───────────────
Description ─────────
Tags ──────  ────────
```

Do not show large centered spinners for ordinary local operations.

Because the application is local-first, most actions should be fast enough that loading states are barely visible.

---

# 72. Button Hierarchy

## Primary

Filled button.

Examples:

```text
New Asset
Save
Create Collection
Resolve Conflict
```

## Secondary

Outlined or neutral button.

Examples:

```text
Edit
Export
Sync Now
```

## Ghost

Low-emphasis actions.

Examples:

```text
Cancel
View Details
```

## Destructive

Used for:

```text
Delete
Revoke Device
Clear Local Data
```

---

# 73. Form Controls

Inputs should use:

```text
label
input
optional helper text
error
```

Example:

```text
Title

[ Docker Cleanup                            ]

A clear name makes assets easier to find.
```

Avoid placeholder text as the only label.

---

# 74. Form Validation

Validation should be inline.

Example:

```text
Title

[                                      ]

Title is required.
```

Errors should appear near the affected field.

---

# 75. Unsaved Form Indicator

The editor header should indicate:

```text
Unsaved changes
```

using text rather than only a color.

---

# 76. Accessibility

LumoSync should target WCAG 2.2 AA principles where applicable.

Requirements:

* keyboard navigability
* visible focus indicators
* sufficient contrast
* semantic labels
* accessible dialogs
* accessible menus
* screen-reader-friendly controls
* no color-only status communication

---

# 77. Focus Management

When a dialog opens:

```text
focus → first logical control
```

When it closes:

```text
focus → trigger that opened it
```

Command palette should return focus to the previous element.

---

# 78. Keyboard Navigation

Every primary interaction must be possible without a mouse.

Examples:

```text
Tab
Shift + Tab
Enter
Space
Arrow keys
Escape
```

Lists should support keyboard selection.

---

# 79. Keyboard Shortcut Reference

| Shortcut               | Action               |
| ---------------------- | -------------------- |
| `Cmd/Ctrl + K`         | Command palette      |
| `Cmd/Ctrl + N`         | New asset            |
| `Cmd/Ctrl + S`         | Save                 |
| `Cmd/Ctrl + Shift + C` | Copy current asset   |
| `Cmd/Ctrl + Shift + F` | Toggle favorite      |
| `Cmd/Ctrl + P`         | Focus search         |
| `Cmd/Ctrl + ,`         | Settings             |
| `Esc`                  | Close dialog/palette |

Platform-specific modifier labels should automatically display:

```text
⌘
```

on macOS and:

```text
Ctrl
```

on Windows/Linux.

---

# 80. Responsive Desktop Behavior

LumoSync is a desktop application, not a mobile web application.

The responsive strategy is therefore based on available desktop width.

### ≥ 1280px

Full layout:

```text
Sidebar + Asset List + Detail
```

### 1024–1279px

Reduced detail width:

```text
Sidebar + Asset List + Detail
```

### < 1024px

Collapse sidebar and use:

```text
Asset List
      ↓
Asset Detail
```

rather than compressing all three regions excessively.

---

# 81. Asset Workspace Layout

Preferred proportions:

```text
Sidebar
20%

Asset list
30%

Detail
50%
```

These should be flexible rather than fixed percentages.

---

# 82. Split Pane Behavior

The asset list/detail divider should be draggable.

The user's preferred divider position should persist locally.

---

# 83. Window Behavior

The application should remember:

* window size
* window position where supported
* sidebar state
* panel widths
* theme
* last opened library context

---

# 84. Start Screen

On first launch:

```text
┌────────────────────────────────────────────────────┐
│                                                    │
│                  Welcome to LumoSync               │
│                                                    │
│        Your local-first developer toolbox.         │
│                                                    │
│        Save commands, snippets and configs.        │
│                                                    │
│             [Create Your First Asset]              │
│                                                    │
│             [Sign In to Sync Devices]              │
│                                                    │
└────────────────────────────────────────────────────┘
```

Do not force authentication before local usage.

The user should be able to begin using LumoSync immediately.

---

# 85. Onboarding Principle

Onboarding should communicate:

```text
1. Your data lives locally.
2. You can use LumoSync offline.
3. Sign in later to synchronize devices.
```

This reinforces the core product differentiator.

---

# 86. First Asset Experience

After creating the first asset:

```text
Asset saved locally.

Sign in later to sync this asset across your devices.
```

This should be contextual, not a blocking prompt.

---

# 87. Sync Onboarding

When the user first enables synchronization:

```text
Sync your developer toolbox

Keep your assets available across trusted devices.

Your existing local library will remain on this device.

[Sign In]
[Not Now]
```

---

# 88. Trust Messaging

Important messaging should repeatedly reinforce:

```text
Saved locally
```

rather than:

```text
Saving...
```

until the remote service confirms something.

For example:

```text
✓ Saved locally
↻ Syncing
```

This makes the local-first model tangible.

---

# 89. Asset Metadata Presentation

Use compact metadata:

```text
Bash · Command
```

rather than verbose labels:

```text
Type: Command
Language: Bash
```

Detailed views may use explicit labels.

---

# 90. Tags

Example:

```text
docker
cleanup
linux
```

Visual style:

```text
small text
subtle background
thin border
6–8px radius
```

---

# 91. Favorite Interaction

Favorite should be an icon button.

States:

```text
☆ Not favorited
★ Favorited
```

The icon must include an accessible label.

Tooltip:

```text
Add to favorites
```

or:

```text
Remove from favorites
```

---

# 92. Recent Usage Metadata

The user should see:

```text
Used 5 min ago
Updated yesterday
```

rather than exposing raw timestamps in the primary UI.

The exact timestamp can appear in a tooltip/detail panel.

---

# 93. Date Formatting

Use human-friendly relative dates in primary interfaces.

Examples:

```text
Just now
5 minutes ago
Yesterday
Monday
Sep 24
```

Detailed metadata can show:

```text
September 24, 2026 at 10:42 AM
```

---

# 94. Asset Deletion

Deleting an asset should use confirmation when the setting:

```text
Confirm before deleting
```

is enabled.

Dialog:

```text
Delete “Docker Cleanup”?

This asset will be removed from your local library and queued for synchronization.

[Cancel] [Delete Asset]
```

This wording is important because deletion is immediately local but remote propagation is asynchronous.

---

# 95. Bulk Operations

MVP can avoid complex bulk actions.

The UI should nevertheless leave room for future selection:

```text
[ ] Docker Cleanup
[ ] Nginx Proxy
[ ] JWT Example
```

Future bulk operations:

```text
Delete
Move
Tag
Favorite
Export
```

---

# 96. Drag and Drop

Potential MVP support:

```text
Drag asset → Collection
```

Drop target becomes visually highlighted.

Future:

```text
Drop file → create asset
```

should only be introduced once the file asset model exists.

---

# 97. Contextual Empty States

Empty states should adapt to the user's context.

First library:

```text
Build your developer toolbox.
```

Search:

```text
Try another search.
```

Collection:

```text
This collection is empty.
```

Favorites:

```text
Star assets you use frequently.
```

Conflicts:

```text
Everything is in sync.
```

---

# 98. Sync Complete State

The ideal healthy state should be almost invisible:

```text
✓ Synced
```

The detailed Sync panel can show:

```text
Everything is up to date.

Last sync
Today, 10:42 AM

0 pending
0 conflicts
```

---

# 99. Notification Priority

Use this hierarchy:

```text
Inline status
    ↓
Toast
    ↓
Persistent banner
    ↓
Modal
```

Use the least intrusive mechanism that communicates the issue adequately.

---

# 100. Animation

Animations should be subtle.

Use:

```text
100–180ms
```

for:

* hover
* focus
* selection
* popovers

Use slightly longer:

```text
180–250ms
```

for:

* dialogs
* panel transitions

Avoid constant animated synchronization indicators except while an operation is actively occurring.

---

# 101. Tailwind Theme Mapping

The design tokens should map to semantic Tailwind variables.

Example:

```css id="gc2g08"
:root {
  --background: 248 250 252;
  --foreground: 15 23 42;

  --card: 255 255 255;
  --card-foreground: 15 23 42;

  --muted: 241 245 249;
  --muted-foreground: 100 116 139;

  --border: 226 232 240;
  --input: 226 232 240;

  --primary: 37 99 235;
  --primary-foreground: 255 255 255;

  --success: 22 163 74;
  --warning: 217 119 6;
  --destructive: 220 38 38;
}
```

Dark theme:

```css id="qg4ck4"
.dark {
  --background: 11 15 20;
  --foreground: 248 250 252;

  --card: 17 24 39;
  --card-foreground: 248 250 252;

  --muted: 26 34 48;
  --muted-foreground: 148 163 184;

  --border: 37 48 68;
  --input: 37 48 68;

  --primary: 96 165 250;
  --primary-foreground: 11 15 20;

  --success: 74 222 128;
  --warning: 251 191 36;
  --destructive: 248 113 113;
}
```

---

# 102. Tailwind Semantic Classes

Components should prefer:

```text
bg-background
text-foreground
bg-card
text-muted-foreground
border-border
bg-primary
text-primary-foreground
text-destructive
```

rather than:

```text
bg-blue-600
text-slate-500
border-gray-200
```

This ensures the entire application can evolve its visual identity centrally.

---

# 103. Component Architecture

Recommended UI component hierarchy:

```text
components/
│
├── layout/
│   ├── AppShell
│   ├── Sidebar
│   ├── Header
│   └── SplitPane
│
├── assets/
│   ├── AssetList
│   ├── AssetRow
│   ├── AssetDetail
│   ├── AssetEditor
│   ├── AssetMetadata
│   ├── AssetTags
│   └── CodeViewer
│
├── search/
│   ├── SearchInput
│   ├── SearchCommand
│   └── SearchResults
│
├── sync/
│   ├── SyncIndicator
│   ├── SyncPanel
│   ├── DeviceList
│   └── ConflictCard
│
├── collections/
│   ├── CollectionCard
│   ├── CollectionList
│   └── CollectionPicker
│
├── common/
│   ├── EmptyState
│   ├── ConfirmDialog
│   ├── StatusBadge
│   ├── KeyboardHint
│   └── RelativeTime
│
└── ui/
    └── shadcn components
```

---

# 104. Feature Boundaries

Feature-specific UI should live with the feature.

Example:

```text
features/assets/
├── components/
├── hooks/
├── schemas/
├── types/
└── pages/
```

This prevents a large global component directory from becoming difficult to maintain.

---

# 105. Component State Rules

Components should distinguish:

```text
idle
loading
success
error
empty
disabled
```

For synchronization:

```text
synced
syncing
pending
offline
error
conflict
```

These states should be represented explicitly.

---

# 106. Design Tokens Summary

```text
Color
  Background
  Surface
  Border
  Text
  Primary
  Success
  Warning
  Danger
  Info

Typography
  Display
  Heading
  Section
  Body
  Small
  Caption
  Code

Spacing
  4
  8
  12
  16
  20
  24
  32
  40
  48
  64

Radius
  4
  6
  8
  10
  12

Motion
  100ms
  180ms
  250ms
```

---

# 107. Primary User Journey

The central user journey should be extremely short:

```text
Launch
  ↓
Library
  ↓
Search / Create
  ↓
Open Asset
  ↓
Copy
```

Secondary journey:

```text
Create
  ↓
Saved locally
  ↓
Continue working
  ↓
Network available
  ↓
Sync automatically
```

---

# 108. Cross-Device Journey

```text
Device A

Create Asset
     ↓
Saved locally
     ↓
Syncing
     ↓
✓ Synced


Device B

Open LumoSync
     ↓
Syncing
     ↓
New asset appears
```

This journey should feel automatic.

The user should not need to think about synchronization mechanics during normal usage.

---

# 109. Core UI Screens

The MVP should implement these screens:

```text
1. Library
2. Asset Detail
3. Asset Editor
4. Favorites
5. Recent
6. Collections
7. Collection Detail
8. Search / Command Palette
9. Sync
10. Conflicts
11. Devices
12. Settings
13. Onboarding
14. About
```

---

# 110. MVP Component Priority

### Tier 1 — Must Have

```text
AppShell
Sidebar
Search
AssetList
AssetRow
AssetDetail
AssetEditor
CodeViewer
NewAsset
CollectionList
SyncIndicator
EmptyState
ConfirmDialog
Toast
CommandPalette
```

### Tier 2 — Important

```text
CollectionPicker
FilterPopover
SortMenu
DeviceList
ConflictCard
DiffViewer
Settings sections
```

### Tier 3 — Later

```text
BulkSelection
DragDrop
Advanced file preview
Semantic search UI
AI suggestions
```

---

# 111. UI Acceptance Criteria

The UI implementation is successful when:

### Library

* User can find an asset within seconds.
* Search results appear without noticeable network latency.
* Asset metadata is understandable at a glance.
* The primary action is always obvious.

### Editor

* Title receives focus when creating an asset.
* Code editing preserves formatting.
* Unsaved state is visible.
* Save is keyboard accessible.
* Destructive navigation warns about unsaved changes.

### Synchronization

* Local save feedback appears immediately.
* Sync status is visible.
* Offline mode is clearly communicated.
* Synchronization errors do not block local work.
* Conflicts are impossible to accidentally overlook.

### Accessibility

* Entire primary workflow works with keyboard.
* Focus states are visible.
* Icon-only buttons have accessible names.
* Status meaning does not depend on color alone.

---

# 112. Final UI Direction

LumoSync's visual hierarchy should ultimately resemble:

```text
┌────────────────────────────────────────────────────────────┐
│ LumoSync                            Search       Sync  User │
├───────────────┬────────────────────────┬───────────────────┤
│               │                        │                   │
│ Library       │ Asset Library          │ Asset             │
│ Favorites     │                        │                   │
│ Recent        │ Search                 │ Docker Cleanup    │
│               │                        │ Bash · Command    │
│ Collections   │ Docker Cleanup         │                   │
│  Git          │ JWT Validation         │ description       │
│  Docker       │ Nginx Proxy            │                   │
│  React        │                        │ ┌───────────────┐ │
│               │                        │ │ code          │ │
│ Tags          │                        │ └───────────────┘ │
│               │                        │                   │
│ Sync          │                        │ [Copy] [Edit]    │
│ Settings      │                        │                   │
└───────────────┴────────────────────────┴───────────────────┘
```

The interface should feel **calm and highly usable**, with the code/content area receiving the most visual attention.

The synchronization system should be **present but secondary**: users should notice when something needs attention, but they should not need to think about synchronization during normal use.

---

# 113. UI Implementation Principle

The most important rule for the frontend implementation is:

> **The UI should make LumoSync's local-first architecture feel effortless.**

That means:

```text
User action
    ↓
Immediate local response
    ↓
UI confirms local state
    ↓
Background synchronization
    ↓
Quiet status update
```

rather than:

```text
User action
    ↓
Wait for API
    ↓
Spinner
    ↓
Remote success
    ↓
UI updates
```

The former is the experience that differentiates LumoSync from a conventional cloud-first developer tool.
