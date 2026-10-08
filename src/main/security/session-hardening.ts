import { session, type Session } from 'electron'
import { createLogger } from '../logging/logger'

const log = createLogger('security')

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self' ws://localhost:* http://localhost:*",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ')

/** Apply CSP and deny unexpected permission requests on the default session. */
export function hardenSession(target: Session = session.defaultSession): void {
  target.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders }
    headers['Content-Security-Policy'] = [CSP]
    headers['X-Content-Type-Options'] = ['nosniff']
    callback({ responseHeaders: headers })
  })

  target.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = permission === 'clipboard-sanitized-write' || permission === 'clipboard-read'
    if (!allowed) {
      log.warn({ permission }, 'Denied permission request')
    }
    callback(allowed)
  })

  log.info('Session hardening applied')
}
