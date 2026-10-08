# LumoSync

Local-first desktop code & asset manager (Electron + React + TypeScript + SQLite).

## Prerequisites

- Node.js 20+
- pnpm 9+
- Windows build tools for `better-sqlite3` (Visual Studio Build Tools / windows-build-tools)

## Setup

```bash
pnpm install
```

`postinstall` rebuilds `better-sqlite3` for Electron’s Node ABI. If you see `NODE_MODULE_VERSION` errors, run `pnpm rebuild:native`.

## Development

```bash
pnpm dev
```

Dev uses a local SQLite file at `./data/lumosync.db`.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Electron + Vite in development |
| `pnpm build` | Production build (`out/`) |
| `pnpm dist` | Package installers into `release/` |
| `pnpm dist:dir` | Unpackaged directory build (fast smoke test) |
| `pnpm checksums` | Write `release/checksums.sha256` |
| `pnpm typecheck` | TypeScript checks |
| `pnpm test` | Vitest via Electron ABI (`better-sqlite3`) |
| `pnpm rebuild:native` | Rebuild `better-sqlite3` for Electron |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

## Multi-device sync demo

Point two app instances at the same sync store:

```bash
# Terminal A
$env:LUMOSYNC_SYNC_STORE="C:\temp\lumo-sync-store.json"; $env:LUMOSYNC_DEV_DB="true"; pnpm dev

# Terminal B (separate userData / DB path recommended)
$env:LUMOSYNC_SYNC_STORE="C:\temp\lumo-sync-store.json"; $env:LUMOSYNC_DEV_DB="true"; pnpm dev
```

Use **Sync Now** on each device. Concurrent edits surface on the Conflicts screen.

## Packaging & release

```bash
pnpm dist        # platform-native installer(s) under release/
pnpm checksums   # SHA-256 manifests for published artifacts
```

- **Production DB path:** `%APPDATA%/lumo-sync/database/` (Windows) / Electron `userData` when packaged.
- **Code signing (optional):** set `CSC_LINK` + `CSC_KEY_PASSWORD` (Windows) or Apple notarization env vars (macOS) before `pnpm dist`.
- **Auto-update (optional):** set `LUMOSYNC_UPDATE_URL` to a generic electron-updater feed; unsigned local builds skip checks.

## Architecture

```text
React renderer → window.lumosync (preload) → IPC handlers → services → SQLite
                                                      ↘ sync engine → file remote store
```

See `BUILD-PLAN.md` and `ARCHITECTURE.md` for the full roadmap.
