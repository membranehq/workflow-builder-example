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

export type HttpMethodWithPayload = Extract<HttpMethod, 'POST' | 'PUT' | 'PATCH'>

export type HttpMethodWithoutPayload = Extract<HttpMethod, 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS'>

export type HttpNodeInputBase = {
  uri: string
  headers?: Record<string, string>
}

export type HttpNodeInputWithPayload = HttpNodeInputBase & {
  method: HttpMethodWithPayload
  payload: unknown
}

export type HttpNodeInputWithoutPayload = HttpNodeInputBase & {
  method: HttpMethodWithoutPayload
}

export type HttpNodeInput = HttpNodeInputWithPayload | HttpNodeInputWithoutPayload

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
 * Universal activity result type for all node executions
 */
export interface ActivityResult {
  /** Unique identifier for the node that was executed */
  nodeId: string

  /** Human-readable message describing the execution result */
  message: string

  /** Input data that was provided to the node */
  input: Record<string, unknown>

  /** Output data from successful execution */
  output?: Record<string, unknown>

  /** Error information if execution failed */
  error?: {
    message: string
    type: string
    details?: unknown
  }
}

/**
 * HTTP-specific activity result
 */
export interface HttpActivityResult extends ActivityResult {
  input: {
    request: {
      uri: string
      method: string
      headers?: Record<string, string>
      queryParameters?: Array<{ key: string; value: string }>
    }
  }
  output?: {
    response: {
      status: number
      statusText: string
      headers: Record<string, string>
      data: unknown
    }
  }
}

/**
 * Filter-specific activity result
 */
export interface FilterActivityResult extends ActivityResult {
  input: {
    dataPath: string
    condition: string
    originalCount?: number
  }
  output?: {
    filteredData: unknown[]
    filteredCount: number
  }
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
