import { ObjectId } from 'mongodb'

import { connectToDatabase } from '../mongodb'
import { HttpNodeData, FilterNodeData, NativeNodeData } from './types'
import { ActivityResult, HttpActivityResult, FilterActivityResult, HttpMethod } from './types'

type HttpMethodWithPayload = Extract<HttpMethod, 'POST' | 'PUT' | 'PATCH'>

export async function fetchWorkflow(workflowId: string) {
  const { db } = await connectToDatabase()

  const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(workflowId) })

  if (!workflow) {
    throw new Error('Workflow not found')
  }

  return workflow
}

export async function executeNode(node: NativeNodeData, context?: { data?: unknown }): Promise<ActivityResult> {
  // Simple node execution - this is where you would integrate with your specific workflow system
  // For Temporal, this might call other activities
  // For AWS Step Functions, this might invoke a Lambda
  // For custom systems, this might call a function or API

  // Add type-specific output
  switch (node.type) {
    case 'trigger':
      return {
        nodeId: node.id,
        message: `Executed ${node.type} node: ${node.name}`,
        input: { nodeType: node.type, nodeName: node.name },
        output: {
          triggerData: { timestamp: new Date().toISOString() },
        },
      }
    case 'condition':
      return {
        nodeId: node.id,
        message: `Executed ${node.type} node: ${node.name}`,
        input: { nodeType: node.type, nodeName: node.name },
        output: {
          conditionResult: { passed: true },
        },
      }
    case 'transform':
      return {
        nodeId: node.id,
        message: `Executed ${node.type} node: ${node.name}`,
        input: { nodeType: node.type, nodeName: node.name },
        output: {},
      }
    case 'http':
      return await executeHttpNode(node as HttpNodeData, context)
    case 'filter':
      return await executeFilterNode(node as FilterNodeData, context)
    default:
      return {
        nodeId: node.id,
        message: `Executed ${node.type} node: ${node.name}`,
        input: { nodeType: node.type, nodeName: node.name },
        output: {},
      }
  }
}

/**
 * Executes an HTTP node by making an HTTP request
 */
async function executeHttpNode(node: HttpNodeData, context?: { data?: unknown }): Promise<HttpActivityResult> {
  // TODO: Add zod validation of the node. Same schema should be used on CRUD operations for HttpNode.

  // Validate required fields
  if (!node.configuration.uri) {
    throw new Error('HTTP node requires uri in configuration')
  }
  if (!node.configuration.method) {
    throw new Error('HTTP node requires method in configuration')
  }

  // Build URL with query parameters
  let requestUrl = node.configuration.uri

  if (node.configuration.queryParameters && node.configuration.queryParameters.length > 0) {
    const url = new URL(node.configuration.uri)
    node.configuration.queryParameters.forEach(({ key, value }) => {
      if (key.trim()) {
        url.searchParams.append(key, value)
      }
    })
    requestUrl = url.toString()
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method: node.configuration.method,
    headers: {
      'Content-Type': 'application/json',
      ...node.configuration.headers,
    },
  }

  // Add payload for methods that require it
  if (isMethodWithPayload(node.configuration.method)) {
    if (context?.data) {
      requestOptions.body = JSON.stringify(context.data)
    }
  }

  const requestData = {
    uri: requestUrl,
    method: node.configuration.method,
    headers: node.configuration.headers,
    ...(node.configuration.queryParameters ? { queryParameters: node.configuration.queryParameters } : {}),
  }

  try {
    // Make the HTTP request
    const response = await fetch(requestUrl, requestOptions)

    // Parse response
    const responseText = await response.text()
    let responseData: unknown

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    return {
      nodeId: node.id,
      message: `HTTP ${node.configuration.method} request completed`,
      input: {
        request: requestData,
      },
      output: {
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
        },
      },
    }
  } catch (error) {
    return {
      nodeId: node.id,
      message: `HTTP ${node.configuration.method} request failed`,
      input: {
        request: requestData,
      },
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'HTTP_REQUEST_ERROR',
      },
    }
  }
}

/**
 * Executes a Filter node by filtering data based on a condition
 */
async function executeFilterNode(node: FilterNodeData, context?: { data?: unknown }): Promise<FilterActivityResult> {
  // Validate required fields
  if (!node.configuration.condition) {
    throw new Error('Filter node requires condition in configuration')
  }
  if (!node.configuration.dataPath) {
    throw new Error('Filter node requires dataPath in configuration')
  }

  const inputData = {
    dataPath: node.configuration.dataPath,
    condition: node.configuration.condition,
  }

  try {
    // Get data from the execution context
    const contextData = context?.data || {}

    if (!contextData || Object.keys(contextData).length === 0) {
      throw new Error('No input data provided to filter node')
    }

    // Extract data using the dataPath (simple implementation for demo)
    // In a real implementation, you'd use a proper JSONPath library
    const dataToFilter = getValueByPath(contextData, node.configuration.dataPath)

    if (dataToFilter === undefined) {
      throw new Error(`No data found at path "${node.configuration.dataPath}" in input data`)
    }

    if (!Array.isArray(dataToFilter)) {
      throw new Error(`Data at path "${node.configuration.dataPath}" is not an array. Found: ${typeof dataToFilter}`)
    }

    // Filter the data using the condition
    const filteredData = dataToFilter.filter((item) => {
      try {
        // Create a safe evaluation context
        const evaluationContext = { item }
        // Simple evaluation - in production, use a proper expression evaluator
        return evaluateCondition(node.configuration.condition, evaluationContext)
      } catch (error) {
        console.warn(`Error evaluating condition for item:`, error)
        return false
      }
    })

    return {
      nodeId: node.id,
      message: `Filtered ${dataToFilter.length} items to ${filteredData.length} items`,
      input: {
        ...inputData,
        originalCount: dataToFilter.length,
      },
      output: {
        filteredData,
        filteredCount: filteredData.length,
      },
    }
  } catch (error) {
    return {
      nodeId: node.id,
      message: `Filter operation failed`,
      input: inputData,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'FILTER_ERROR',
      },
    }
  }
}

/**
 * Simple path resolver for nested object properties
 * In production, use a proper JSONPath library like jsonpath-plus
 */
function getValueByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    return current && typeof current === 'object' && current !== null && key in current
      ? (current as Record<string, unknown>)[key]
      : undefined
  }, obj)
}

/**
 * Simple condition evaluator
 * In production, use a proper expression evaluator like expr-eval or vm2
 */
function evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
  // This is a very basic implementation for demo purposes
  // In production, you should use a proper expression evaluator for security

  // Replace 'item' with the actual item from context
  const expression = condition.replace(/item\./g, 'context.item.')

  // Create a function that evaluates the condition
  // WARNING: This uses eval which is dangerous in production
  // Use a proper expression evaluator instead
  try {
    const func = new Function('context', `return ${expression}`)
    return Boolean(func(context))
  } catch (error) {
    throw new Error(`Invalid condition expression: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function isMethodWithPayload(method: string): method is HttpMethodWithPayload {
  const methodsWithPayload: HttpMethodWithPayload[] = ['POST', 'PUT', 'PATCH']
  return methodsWithPayload.includes(method as HttpMethodWithPayload)
}
