import { safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { createLogger } from '../logging/logger'

const log = createLogger('credentials')

/**
 * OS-backed secret storage via Electron safeStorage.
 * Ciphertext is persisted under the provided directory; plaintext never is.
 */
export class CredentialStore {
  private readonly filePath: string

  constructor(storageDir: string) {
    mkdirSync(storageDir, { recursive: true })
    this.filePath = join(storageDir, 'secrets.bin.json')
  }

  isEncryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  setSecret(key: string, value: string): void {
    if (!this.isEncryptionAvailable()) {
      throw new Error('Secure credential storage is unavailable on this system')
    }
    const store = this.read()
    const encrypted = safeStorage.encryptString(value)
    store[key] = encrypted.toString('base64')
    this.write(store)
    log.info({ key }, 'Secret stored')
  }

  getSecret(key: string): string | null {
    const store = this.read()
    const encoded = store[key]
    if (!encoded) return null
    if (!this.isEncryptionAvailable()) {
      throw new Error('Secure credential storage is unavailable on this system')
    }
    try {
      return safeStorage.decryptString(Buffer.from(encoded, 'base64'))
    } catch (error) {
      log.warn({ err: error, key }, 'Failed to decrypt secret')
      return null
    }
  }

  deleteSecret(key: string): void {
    const store = this.read()
    if (!(key in store)) return
    delete store[key]
    this.write(store)
  }

  private read(): Record<string, string> {
    if (!existsSync(this.filePath)) return {}
    try {
      return JSON.parse(readFileSync(this.filePath, 'utf8')) as Record<string, string>
    } catch {
      return {}
    }
  }

  private write(store: Record<string, string>): void {
    mkdirSync(dirname(this.filePath), { recursive: true })
    writeFileSync(this.filePath, JSON.stringify(store), 'utf8')
  }
}

export const SYNC_CREDENTIAL_KEYS = {
  accessToken: 'sync.access_token',
  refreshToken: 'sync.refresh_token'
} as const
