import { describe, expect, it } from 'vitest'
import {
  ALLOWED_IPC_CHANNELS,
  isAllowedEventName,
  isAllowedIpcChannel
} from '../src/main/security'
import { AppEvents, IpcChannels } from '../src/shared/constants'

describe('security hardening', () => {
  it('exposes a non-empty IPC allowlist covering known channels', () => {
    expect(ALLOWED_IPC_CHANNELS.length).toBeGreaterThan(10)
    expect(isAllowedIpcChannel(IpcChannels.asset.list)).toBe(true)
    expect(isAllowedIpcChannel(IpcChannels.sync.now)).toBe(true)
    expect(isAllowedIpcChannel('evil:channel')).toBe(false)
  })

  it('allows only documented app events', () => {
    expect(isAllowedEventName(AppEvents.syncStatusChanged)).toBe(true)
    expect(isAllowedEventName('not.a.real.event')).toBe(false)
  })
})
