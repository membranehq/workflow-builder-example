import type { Action } from './types/workflow'

export const getActionName = (action: Action | undefined) => {
  return action?.name || action?.key || ''
}

export const getIntegrationName = (connection: { name?: string; integration?: { key?: string } } | undefined) => {
  return connection?.name || connection?.integration?.key || ''
}
