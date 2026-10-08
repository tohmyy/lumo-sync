import { contextBridge } from 'electron'
import { createPreloadApi } from './api'

const api = createPreloadApi()

contextBridge.exposeInMainWorld('lumosync', api)
