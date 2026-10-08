export const IpcChannels = {
  asset: {
    list: 'asset:list',
    get: 'asset:get',
    create: 'asset:create',
    update: 'asset:update',
    delete: 'asset:delete',
    restore: 'asset:restore'
  },
  collection: {
    list: 'collection:list',
    get: 'collection:get',
    create: 'collection:create',
    update: 'collection:update',
    delete: 'collection:delete',
    addAsset: 'collection:add-asset',
    removeAsset: 'collection:remove-asset',
    listAssets: 'collection:list-assets'
  },
  tag: {
    list: 'tag:list',
    create: 'tag:create',
    update: 'tag:update',
    delete: 'tag:delete'
  },
  search: {
    query: 'search:query'
  },
  recent: {
    list: 'recent:list',
    track: 'recent:track'
  },
  settings: {
    get: 'settings:get',
    getAll: 'settings:get-all',
    update: 'settings:update'
  },
  device: {
    getCurrent: 'device:get-current',
    list: 'device:list'
  },
  sync: {
    status: 'sync:status',
    now: 'sync:now',
    listConflicts: 'sync:list-conflicts',
    resolveConflict: 'sync:resolve-conflict'
  }
} as const

export type IpcChannel =
  | (typeof IpcChannels.asset)[keyof typeof IpcChannels.asset]
  | (typeof IpcChannels.collection)[keyof typeof IpcChannels.collection]
  | (typeof IpcChannels.tag)[keyof typeof IpcChannels.tag]
  | (typeof IpcChannels.search)[keyof typeof IpcChannels.search]
  | (typeof IpcChannels.recent)[keyof typeof IpcChannels.recent]
  | (typeof IpcChannels.settings)[keyof typeof IpcChannels.settings]
  | (typeof IpcChannels.device)[keyof typeof IpcChannels.device]
  | (typeof IpcChannels.sync)[keyof typeof IpcChannels.sync]
