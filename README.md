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
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript checks |
| `pnpm test` | Vitest via Electron ABI (`better-sqlite3`) |
| `pnpm rebuild:native` | Rebuild `better-sqlite3` for Electron |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

## Architecture (Phases 0–2)

```text
React renderer → window.lumosync (preload) → IPC handlers → services → SQLite
```

See `BUILD-PLAN.md` and `ARCHITECTURE.md` for the full roadmap.
