import { existsSync, readdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

export interface MigrationDefinition {
  version: number
  name: string
  sql: string
}

function candidateDirs(): string[] {
  const dirs: string[] = []

  // Bundled electron-vite output: out/main/database/migrations
  dirs.push(join(__dirname, 'database', 'migrations'))

  // Source tree (vitest / electron-vite dev with filesystem layout)
  dirs.push(join(process.cwd(), 'src', 'main', 'database', 'migrations'))

  // Next to this module when not fully bundled
  try {
    dirs.push(dirname(fileURLToPath(import.meta.url)))
  } catch {
    // ignore
  }

  return dirs
}

export function getMigrationsDirectory(): string {
  for (const dir of candidateDirs()) {
    if (existsSync(join(dir, '001_initial_schema.sql'))) {
      return dir
    }
  }
  throw new Error(
    `Migrations directory not found. Looked in: ${candidateDirs().join(', ')}`
  )
}

/** Ordered migrations bundled with the main process. */
export function loadMigrations(): MigrationDefinition[] {
  const migrationsDir = getMigrationsDirectory()
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  return files.map((name) => {
    const match = /^(\d+)_/.exec(name)
    if (!match?.[1]) {
      throw new Error(`Invalid migration filename: ${name}`)
    }
    return {
      version: Number.parseInt(match[1], 10),
      name,
      sql: readFileSync(join(migrationsDir, name), 'utf8')
    }
  })
}
