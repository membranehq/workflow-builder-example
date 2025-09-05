export type NodeType = 'condition' | 'trigger' | 'transform' | 'http' | 'filter'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

/**
 * Base node type for workflow execution
 */
export interface WorkflowNode {
  /** Unique identifier for the node */
  id: string

  /** Human-readable name for the node */
  name: string

  /** Type of node (condition, trigger, transform, http) */
  type: NodeType

  /** Input mapping for the node - defines how data flows into the node */
  inputMapping: Record<string, unknown>
}

/**
 * Input data for HTTP nodes
 */
export type HttpNodeInput =
  | {
      /** The URI to make the HTTP request to */
      uri: string

      /** HTTP method that requires payload */
      method: Extract<HttpMethod, 'POST' | 'PUT' | 'PATCH'>

      /** HTTP headers to include in the request */
      headers?: Record<string, string>

      /** Request payload/body (required for POST, PUT, PATCH) */
      payload: unknown
    }
  | {
      /** The URI to make the HTTP request to */
      uri: string

      /** HTTP method that doesn't require payload */
      method: Extract<HttpMethod, 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS'>

      /** HTTP headers to include in the request */
      headers?: Record<string, string>
    }

/**
 * Workflow definition containing nodes
 */
export interface WorkflowDefinition {
  /** Unique identifier for the workflow */
  id: string

  /** Human-readable name for the workflow */
  name: string

  /** Array of nodes in the workflow */
  nodes: WorkflowNode[]
}

/**
 * Result of executing a workflow node
 */
export interface NodeExecutionResult {
  /** Unique identifier for the execution */
  id: string

  /** Node that was executed */
  nodeId: string

  /** Whether the execution was successful */
  success: boolean

  /** Output data from the node execution */
  output?: unknown

  /** Error information if execution failed */
  error?: {
    message: string
    code?: string
    details?: unknown
  }
}

/**
 * Context for workflow execution
 */
export interface WorkflowExecutionContext {
  /** Results from previously executed nodes */
  nodeResults: Map<string, NodeExecutionResult>

  /** Workflow-level state and variables */
  workflowState: Map<string, unknown>

  /** Execution identifier */
  executionId: string

  /** Execution start time */
  startTime: Date
}

/**
 * Configuration for workflow execution
 */
export interface WorkflowExecutionConfig {
  /** Maximum execution time for the workflow */
  timeout?: number

  /** Retry configuration for failed nodes */
  retry?: {
    maxAttempts: number
    backoffMs: number
  }

  /** Parallel execution configuration */
  parallel?: {
    maxConcurrency: number
  }

  /** Error handling strategy */
  errorHandling?: 'stop' | 'continue' | 'retry'
}

/**
 * Node execution function type
 */
export type NodeExecutor = (node: WorkflowNode, context: WorkflowExecutionContext) => Promise<NodeExecutionResult>

/**
 * Workflow execution function type
 */
export type WorkflowExecutor = (
  definition: WorkflowDefinition,
  config?: WorkflowExecutionConfig,
) => Promise<NodeExecutionResult[]>

/**
 * Node validation function type
 */
export type NodeValidator = (node: WorkflowNode) => boolean

/**
 * Workflow validation function type
 */
export type WorkflowValidator = (definition: WorkflowDefinition) => {
  valid: boolean
  errors: string[]
}

/**
 * Common node types
 */
export const NodeTypes = {
  /** Trigger node - starts a workflow */
  TRIGGER: 'trigger' as const,

  /** Action node - performs an operation */
  ACTION: 'action' as const,

  /** Condition node - makes decisions */
  CONDITION: 'condition' as const,

  /** Transform node - transforms data */
  TRANSFORM: 'transform' as const,
} as const
