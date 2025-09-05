import { ObjectId } from 'mongodb'

import { connectToDatabase } from '../mongodb'
import { HttpNodeData, FilterNodeData, NativeNodeData } from '@/app/workflows/[id]/components/types/workflow'

export async function fetchWorkflow(workflowId: string) {
  const { db } = await connectToDatabase()

  const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(workflowId) })

  if (!workflow) {
    throw new Error('Workflow not found')
  }

  return workflow
}

export async function executeNode(node: NativeNodeData) {
  // Simple node execution - this is where you would integrate with your specific workflow system
  // For Temporal, this might call other activities
  // For AWS Step Functions, this might invoke a Lambda
  // For custom systems, this might call a function or API

  // For now, return a mock result based on the node type
  const baseOutput = {
    message: `Executed ${node.type} node: ${node.name}`,
    nodeId: node.id,
  }

  // Add type-specific output
  switch (node.type) {
    case 'trigger':
      return {
        output: {
          ...baseOutput,
          triggerData: { timestamp: new Date().toISOString() },
        },
      }
    case 'condition':
      return {
        output: {
          ...baseOutput,
          conditionResult: { passed: true },
        },
      }
    case 'transform':
      return {
        output: {
          ...baseOutput,
        },
      }
    case 'http':
      return await executeHttpNode(node as HttpNodeData)
    case 'filter':
      return await executeFilterNode(node as FilterNodeData)
    default:
      return {
        output: baseOutput,
      }
  }
}

/**
 * Executes an HTTP node by making an HTTP request
 */
async function executeHttpNode(node: HttpNodeData) {
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

  // TODO: add payload for methods that require it. Payload will come from previous node (result of running it).

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
      message: `HTTP ${node.configuration.method} request completed`,
      nodeId: node.id,
      request: {
        uri: requestUrl,
        method: node.configuration.method,
        headers: node.configuration.headers,
        ...(node.configuration.queryParameters ? { queryParameters: node.configuration.queryParameters } : {}),
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
      },
    }
  } catch (error) {
    return {
      message: `HTTP ${node.configuration.method} request failed`,
      nodeId: node.id,
      request: {
        uri: requestUrl,
        method: node.configuration.method,
        headers: node.configuration.headers,
        ...(node.configuration.queryParameters ? { queryParameters: node.configuration.queryParameters } : {}),
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
async function executeFilterNode(node: FilterNodeData) {
  // Validate required fields
  if (!node.configuration.condition) {
    throw new Error('Filter node requires condition in configuration')
  }
  if (!node.configuration.dataPath) {
    throw new Error('Filter node requires dataPath in configuration')
  }

  try {
    // TODO: In a real implementation, this would receive data from the previous node
    // For now, we'll use mock data to demonstrate the filtering logic
    const mockData = {
      items: [
        { id: 1, name: 'John', age: 25, status: 'active' },
        { id: 2, name: 'Jane', age: 17, status: 'inactive' },
        { id: 3, name: 'Bob', age: 30, status: 'active' },
        { id: 4, name: 'Alice', age: 16, status: 'pending' },
      ],
    }

    // Extract data using the dataPath (simple implementation for demo)
    // In a real implementation, you'd use a proper JSONPath library
    const dataToFilter = getValueByPath(mockData, node.configuration.dataPath)

    if (!Array.isArray(dataToFilter)) {
      throw new Error(`Data at path "${node.configuration.dataPath}" is not an array`)
    }

    // Filter the data using the condition
    const filteredData = dataToFilter.filter((item) => {
      try {
        // Create a safe evaluation context
        const context = { item }
        // Simple evaluation - in production, use a proper expression evaluator
        return evaluateCondition(node.configuration.condition, context)
      } catch (error) {
        console.warn(`Error evaluating condition for item:`, error)
        return false
      }
    })

    return {
      message: `Filtered ${dataToFilter.length} items to ${filteredData.length} items`,
      nodeId: node.id,
      input: {
        dataPath: node.configuration.dataPath,
        condition: node.configuration.condition,
        originalCount: dataToFilter.length,
      },
      output: {
        filteredData,
        filteredCount: filteredData.length,
      },
    }
  } catch (error) {
    return {
      message: `Filter operation failed`,
      nodeId: node.id,
      input: {
        dataPath: node.configuration.dataPath,
        condition: node.configuration.condition,
      },
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
