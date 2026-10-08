import { app } from 'electron'
import { bootstrapApp } from './bootstrap/app-bootstrap'
import { createLogger } from './logging/logger'

const log = createLogger('main')

app.setName('LumoSync')

bootstrapApp().catch((error) => {
  log.error({ err: error }, 'Failed to bootstrap application')
  app.quit()
})
