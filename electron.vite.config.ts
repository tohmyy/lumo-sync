import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function copyMigrationsPlugin(): Plugin {
  return {
    name: 'copy-sql-migrations',
    closeBundle() {
      const srcDir = resolve('src/main/database/migrations')
      const outDir = resolve('out/main/database/migrations')
      mkdirSync(outDir, { recursive: true })
      for (const file of readdirSync(srcDir)) {
        if (file.endsWith('.sql')) {
          copyFileSync(join(srcDir, file), join(outDir, file))
        }
      }
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyMigrationsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/main/index.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react()],
    root: resolve('src/renderer'),
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html')
        }
      }
    }
  }
})
