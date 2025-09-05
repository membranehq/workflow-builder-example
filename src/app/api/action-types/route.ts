import { NextResponse } from 'next/server'
import type { NodeTypesResponse, NodeTypeConfigUnion } from '@/types/action-types'
import { HttpMethod } from '@/lib/temporal/types'

// Define the standard node types and their configurations based on NativeNode structure
const NODE_TYPES: NodeTypeConfigUnion[] = [
  {
    type: 'http',
    name: 'HTTP Request',
    description: 'Make HTTP requests to external APIs or webhooks',
    category: 'integration',
    isAsync: true,
    icon: '🌐',
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
  {
    type: 'filter',
    name: 'Data Filter',
    description: 'Filter data based on conditions using JavaScript expressions',
    category: 'transform',
    isAsync: false,
    icon: '🔍',
    color: 'green',
    configurationSchema: {
      type: 'object',
      properties: {
        dataPath: {
          type: 'string',
          description: 'JSONPath expression to access the array of data to filter',
        },
        condition: {
          type: 'string',
          description: 'JavaScript expression to filter each item. Use "item" to reference the current array element.',
        },
      },
      required: ['dataPath', 'condition'],
    },
  },
  {
    type: 'condition',
    name: 'Conditional Logic',
    description: 'Execute different paths based on conditional logic',
    category: 'condition',
    isAsync: false,
    icon: '❓',
    color: 'yellow',
    configurationSchema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'JavaScript expression that evaluates to true or false',
        },
        truePath: {
          type: 'string',
          description: 'Path to follow when condition is true',
        },
        falsePath: {
          type: 'string',
          description: 'Path to follow when condition is false',
        },
      },
      required: ['expression'],
    },
  },
  {
    type: 'transform',
    name: 'Data Transform',
    description: 'Transform and map data from one format to another',
    category: 'transform',
    isAsync: false,
    icon: '🔄',
    color: 'purple',
    configurationSchema: {
      type: 'object',
      properties: {
        mapping: {
          type: 'object',
          description: 'Object mapping input fields to output fields',
        },
        script: {
          type: 'string',
          description: 'Optional JavaScript code for complex transformations',
        },
      },
      required: ['mapping'],
    },
  },
  {
    type: 'trigger',
    name: 'Event Trigger',
    description: 'Trigger workflows based on events or conditions',
    category: 'workflow',
    isAsync: false,
    icon: '⚡',
    color: 'red',
    configurationSchema: {
      type: 'object',
      properties: {
        eventType: {
          type: 'string',
          description: 'Type of event that triggers this workflow',
        },
        conditions: {
          type: 'object',
          description: 'Additional conditions that must be met for the trigger',
        },
      },
      required: ['eventType'],
    },
  },
]

// Create a lookup object for easy access by type
const NODE_TYPES_BY_TYPE: Record<string, NodeTypeConfigUnion> = {}
NODE_TYPES.forEach((nodeType) => {
  NODE_TYPES_BY_TYPE[nodeType.type] = nodeType
})

export async function GET() {
  try {
    const response: NodeTypesResponse = {
      nodeTypes: NODE_TYPES,
      nodeTypesByType: NODE_TYPES_BY_TYPE,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch node types:', error)
    return NextResponse.json({ error: 'Failed to fetch node types' }, { status: 500 })
  }
}
