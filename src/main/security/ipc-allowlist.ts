import { IpcChannels, ALLOWED_EVENTS, type IpcChannel } from '../../shared/constants'

const CHANNEL_VALUES = Object.values(IpcChannels).flatMap((group) => Object.values(group))

export const ALLOWED_IPC_CHANNELS: readonly IpcChannel[] = CHANNEL_VALUES as IpcChannel[]

export function isAllowedIpcChannel(channel: string): channel is IpcChannel {
  return (ALLOWED_IPC_CHANNELS as readonly string[]).includes(channel)
}

export function assertAllowedIpcChannel(channel: string): asserts channel is IpcChannel {
  if (!isAllowedIpcChannel(channel)) {
    throw new Error(`IPC channel not allowed: ${channel}`)
  }
}

export function isAllowedEventName(event: string): boolean {
  return (ALLOWED_EVENTS as readonly string[]).includes(event)
}
