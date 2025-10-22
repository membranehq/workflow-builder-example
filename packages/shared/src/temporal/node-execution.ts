import { IntegrationAppClient } from '@membranehq/sdk'
import { WorkflowNode, NodeExecutionResult } from './types.js'

/**
 * Resolves variables from previous node outputs using inputMapping
 */
export function resolveVariables(
  inputMapping: Record<string, unknown>,
  previousResults: NodeExecutionResult[],
): Record<string, unknown> {
  const resolvedInputs: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(inputMapping)) {
    if (typeof value === 'object' && value !== null && '$var' in value) {
      // Handle variable references like { "$var": "$.Previous Steps.HTTP Request.id" }
      const variablePath = (value as { $var: string }).$var
      resolvedInputs[key] = resolveVariablePath(variablePath, previousResults)
    } else {
      // Direct value
      resolvedInputs[key] = value
    }
  }

  return resolvedInputs
}

/**
 * Resolves a variable path from previous node results
 * Supports paths like "$.Previous Steps.HTTP Request.id" or "$.HTTP Request.data"
 */
function resolveVariablePath(path: string, previousResults: NodeExecutionResult[]): unknown {
  if (!path.startsWith('$.')) {
    throw new Error(`Invalid variable path: ${path}. Must start with "$."`)
  }

  const pathParts = path.substring(2).split('.') // Remove "$." and split

  // Handle "Previous Steps" prefix
  if (pathParts[0] === 'Previous Steps') {
    pathParts.shift() // Remove "Previous Steps"
  }

  let currentData: unknown = previousResults

  // Find the node result by name (combining multiple parts if needed)
  let nodeName = ''
  let remainingPath: string[] = []

  // Try to find the node by combining path parts until we find a match
  for (let i = 0; i < pathParts.length; i++) {
    const testName = pathParts.slice(0, i + 1).join(' ')
    const result = previousResults.find(
      (result) =>
        result.nodeId === testName ||
        (result as any).nodeName === testName ||
        // Also check if any result has a name that matches
        (result as any).name === testName,
    )

    if (result) {
      nodeName = testName
      remainingPath = pathParts.slice(i + 1)
      currentData = result.output
      break
    }
  }

  if (!nodeName) {
    // If no node found by name, try to find by ID or use the first part as node identifier
    const result = previousResults.find((result) => result.nodeId === pathParts[0])
    if (result) {
      currentData = result.output
      remainingPath = pathParts.slice(1)
    } else {
      throw new Error(`Node not found: ${pathParts[0]}`)
    }
  }

  // Navigate through the remaining path in the output data
  for (const part of remainingPath) {
    if (currentData && typeof currentData === 'object') {
      currentData = (currentData as Record<string, unknown>)[part]
    } else {
      throw new Error(
        `Cannot access property ${part} on ${typeof currentData}. Current data: ${JSON.stringify(currentData)}`,
      )
    }
  }

  return currentData
}

/**
 * Executes a trigger node
 */
export async function executeTriggerNode(
  node: WorkflowNode,
  triggerInput: Record<string, unknown> = {},
): Promise<NodeExecutionResult> {
  const triggerType = node.triggerType || 'manual'

  try {
    let output: unknown = {}

    switch (triggerType) {
      case 'manual':
        output = {
          triggerType: 'manual',
          timestamp: new Date().toISOString(),
          event: node.config?.inputMapping?.event || 'manual.trigger',
          ...triggerInput,
        }
        break
      case 'event':
        output = {
          triggerType: 'event',
          timestamp: new Date().toISOString(),
          event: node.config?.inputMapping?.event || 'workflow.triggered',
          // Include trigger input data
          ...triggerInput,
        }
        break
      default:
        throw new Error(`Unsupported trigger type: ${triggerType}`)
    }

    return {
      id: `${node.id}-${Date.now()}`,
      nodeId: node.id,
      success: true,
      input: { ...node.config?.inputMapping, ...triggerInput },
      output,
    }
  } catch (error) {
    return {
      id: `${node.id}-${Date.now()}`,
      nodeId: node.id,
      success: false,
      input: { ...node.config?.inputMapping, ...triggerInput },
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'TRIGGER_EXECUTION_ERROR',
        details: error,
      },
    }
  }
}

/**
 * Executes an HTTP action node
 */
export async function executeHttpActionNode(
  node: WorkflowNode,
  resolvedInputs: Record<string, unknown>,
): Promise<NodeExecutionResult> {
  try {
    const { uri, method, headers = {}, body } = resolvedInputs

    if (!uri || typeof uri !== 'string') {
      throw new Error('HTTP node requires uri in inputMapping')
    }

    if (!method || typeof method !== 'string') {
      throw new Error('HTTP node requires method in inputMapping')
    }

    const requestOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...(typeof headers === 'object' ? headers : {}),
      },
    }

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    const response = await fetch(uri, requestOptions)
    const responseText = await response.text()

    let responseData: unknown
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    const output = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
    }

    return {
      id: `${node.id}-${Date.now()}`,
      nodeId: node.id,
      success: response.ok,
      input: resolvedInputs,
      output,
      error: !response.ok
        ? {
            message: `HTTP ${method} request failed with status ${response.status}`,
            code: 'HTTP_ERROR',
            details: { status: response.status, statusText: response.statusText },
          }
        : undefined,
    }
  } catch (error) {
    return {
      id: `${node.id}-${Date.now()}`,
      nodeId: node.id,
      success: false,
      input: resolvedInputs,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'HTTP_EXECUTION_ERROR',
        details: error,
      },
    }
  }
}

/**
 * Executes an action node by calling the integration.app API
 */
export async function executeActionNode(
  node: WorkflowNode,
  resolvedInputs: Record<string, unknown>,
  membraneToken: string,
): Promise<NodeExecutionResult> {
  try {
    if (!node.config?.actionId) {
      throw new Error('Action node requires actionId in config')
    }

    const membraneClient = new IntegrationAppClient({
      token: membraneToken,
    })

    try {
      const result = await membraneClient
        .connection(node.config.integrationKey!)
        .action(node.config.actionId)
        .run(resolvedInputs)

      return {
        id: `${node.id}-${Date.now()}`,
        nodeId: node.id,
        success: true,
        input: resolvedInputs,
        output: result,
      }
    } catch (error) {
      return {
        id: `${node.id}-${Date.now()}`,
        nodeId: node.id,
        success: false,
        input: resolvedInputs,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'ACTION_EXECUTION_ERROR',
          details: error,
        },
      }
    }
  } catch (error) {
    return {
      id: `${node.id}-${Date.now()}`,
      nodeId: node.id,
      success: false,
      input: resolvedInputs,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'ACTION_EXECUTION_ERROR',
        details: error,
      },
    }
  }
}

/**
 * Enhanced node result with name for better variable resolution
 */
export interface EnhancedNodeExecutionResult extends NodeExecutionResult {
  nodeName?: string
}

export async function executeWorkflowNode(
  node: WorkflowNode,
  previousResults: EnhancedNodeExecutionResult[],
  membraneToken: string,
  triggerInput: Record<string, unknown> = {},
): Promise<EnhancedNodeExecutionResult> {
  const resolvedInputs =
    Object.keys(node?.config?.inputMapping || {}).length > 0
      ? resolveVariables(node?.config?.inputMapping!, previousResults)
      : {}

  let result: NodeExecutionResult

  switch (node.type) {
    case 'trigger':
      result = await executeTriggerNode(node, triggerInput)
      break

    case 'action':
      switch (node.nodeType) {
        case 'http':
          result = await executeHttpActionNode(node, resolvedInputs)
          break
        case 'action':
          result = await executeActionNode(node, resolvedInputs, membraneToken)
          break
        default:
          throw new Error(`Unsupported action node type: ${node.nodeType}`)
      }
      break

    default:
      throw new Error(`Unsupported node type: ${node.type}`)
  }

  // Add node name for better variable resolution
  return {
    ...result,
    nodeName: node.name,
  }
}
