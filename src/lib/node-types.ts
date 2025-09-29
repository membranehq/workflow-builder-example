import { HttpMethod } from './temporal/types'
import type { ElementType } from 'react'
import { GlobeIcon, Package, MousePointerClickIcon, BoltIcon } from 'lucide-react'

// Define trigger types
export interface TriggerType {
  type: 'manual' | 'event'
  name: string
  description: string
  icon: ElementType
  color: string
  configurationSchema?: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

// Define node type metadata
export interface NodeTypeMetadata {
  type: 'http' | 'action'
  name: string
  description: string
  category: string
  icon: ElementType
  color: string
  configurationSchema?: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export const TRIGGER_TYPES: Record<string, TriggerType> = {
  manual: {
    type: 'manual',
    name: 'Manual Trigger',
    description: 'Start the workflow manually',
    icon: MousePointerClickIcon,
    color: 'blue',
  },
  event: {
    type: 'event',
    name: 'Event Trigger',
    description: 'Trigger the workflow based on events',
    icon: BoltIcon,
    color: 'red',
    configurationSchema: {
      type: 'object',
      properties: {
        event: {
          type: 'string',
          description: 'Name of the event that triggers this workflow',
          enum: ['workflow.deleted', 'workflow.failed', 'workflow.created'],
        },
      },
      required: ['event'],
    },
  },
}

export const NODE_TYPES: Record<string, NodeTypeMetadata> = {
  http: {
    type: 'http',
    name: 'HTTP Request',
    description: 'Make HTTP requests to external APIs or webhooks',
    category: 'integration',
    icon: GlobeIcon,
    color: 'blue',
    configurationSchema: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          description: 'The URL to make the request to',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as HttpMethod[],
          description: 'HTTP method to use for the request',
        },
        headers: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'HTTP headers to include in the request',
        },
        queryParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
            },
          },
          description: 'Query parameters to append to the URL',
        },
      },
      required: ['uri', 'method'],
    },
  },

  action: {
    type: 'action',
    name: 'Action',
    description: 'Perform action',
    category: 'action',
    icon: Package,
    color: 'purple',
  },
}
