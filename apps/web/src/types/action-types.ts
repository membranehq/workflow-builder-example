import { NodeType, HttpMethod } from '@temporal/types'

export interface NodeTypeConfig {
  type: NodeType
  name: string
  description: string
  category: 'data' | 'workflow' | 'notification' | 'integration' | 'transform' | 'condition'
  configurationSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
  requiresConnection?: boolean
  requiresCollection?: boolean
  icon?: string
  color?: string
}

export interface HttpNodeConfig extends NodeTypeConfig {
  type: 'http'
  configurationSchema: {
    type: 'object'
    properties: {
      uri: {
        type: 'string'
        description: string
      }
      method: {
        type: 'string'
        enum: HttpMethod[]
        description: string
      }
      headers: {
        type: 'object'
        additionalProperties: { type: 'string' }
        description: string
      }
      queryParameters: {
        type: 'array'
        items: {
          type: 'object'
          properties: {
            key: { type: 'string' }
            value: { type: 'string' }
          }
        }
        description: string
      }
    }
    required: ['uri', 'method']
  }
}

export interface FilterNodeConfig extends NodeTypeConfig {
  type: 'filter'
  configurationSchema: {
    type: 'object'
    properties: {
      dataPath: {
        type: 'string'
        description: string
      }
      condition: {
        type: 'string'
        description: string
      }
    }
    required: ['dataPath', 'condition']
  }
}

export interface ConditionNodeConfig extends NodeTypeConfig {
  type: 'condition'
  configurationSchema: {
    type: 'object'
    properties: {
      expression: {
        type: 'string'
        description: string
      }
      truePath: {
        type: 'string'
        description: string
      }
      falsePath: {
        type: 'string'
        description: string
      }
    }
    required: ['expression']
  }
}

export interface TransformNodeConfig extends NodeTypeConfig {
  type: 'transform'
  configurationSchema: {
    type: 'object'
    properties: {
      mapping: {
        type: 'object'
        description: string
      }
      script: {
        type: 'string'
        description: string
      }
    }
    required: ['mapping']
  }
}

export interface TriggerNodeConfig extends NodeTypeConfig {
  type: 'trigger'
  configurationSchema: {
    type: 'object'
    properties: {
      eventType: {
        type: 'string'
        description: string
      }
      conditions: {
        type: 'object'
        description: string
      }
    }
    required: ['eventType']
  }
}

export type NodeTypeConfigUnion =
  | HttpNodeConfig
  | FilterNodeConfig
  | ConditionNodeConfig
  | TransformNodeConfig
  | TriggerNodeConfig

export interface NodeTypesResponse {
  nodeTypes: NodeTypeConfigUnion[]
  nodeTypesByType: Record<NodeType, NodeTypeConfigUnion>
}
