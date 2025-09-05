import { ObjectId } from 'mongodb'

import { connectToDatabase } from '../mongodb'
import type { WorkflowNode, HttpNodeInput } from './types'

export async function fetchWorkflow(workflowId: string) {
  const { db } = await connectToDatabase()

  const workflow = await db.collection('workflows').findOne({ _id: new ObjectId(workflowId) })

  if (!workflow) {
    throw new Error('Workflow not found')
  }

  return workflow
}

export async function executeNode(node: WorkflowNode) {
  // Simple node execution - this is where you would integrate with your specific workflow system
  // For Temporal, this might call other activities
  // For AWS Step Functions, this might invoke a Lambda
  // For custom systems, this might call a function or API

  // For now, return a mock result based on the node type
  const baseOutput = {
    message: `Executed ${node.type} node: ${node.name}`,
    nodeId: node.id,
    inputData: node.inputMapping,
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
          transformedData: node.inputMapping,
        },
      }
    case 'http':
      return await executeHttpNode(node)
    default:
      return {
        output: baseOutput,
      }
  }
}

/**
 * Executes an HTTP node by making an HTTP request
 */
async function executeHttpNode(node: WorkflowNode) {
  const httpInput = node.inputMapping as unknown as HttpNodeInput

  // Validate required fields
  if (!httpInput.uri) {
    throw new Error('HTTP node requires uri in inputMapping')
  }
  if (!httpInput.method) {
    throw new Error('HTTP node requires method in inputMapping')
  }

  // Build URL with query parameters
  let requestUrl = httpInput.uri
  if (httpInput.queryParameters && httpInput.queryParameters.length > 0) {
    const url = new URL(httpInput.uri)
    httpInput.queryParameters.forEach(({ key, value }) => {
      if (key.trim()) {
        url.searchParams.append(key, value)
      }
    })
    requestUrl = url.toString()
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method: httpInput.method,
    headers: {
      'Content-Type': 'application/json',
      ...httpInput.headers,
    },
  }

  // Add payload for methods that require it
  if ('payload' in httpInput) {
    requestOptions.body = JSON.stringify(httpInput.payload)
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
      output: {
        message: `HTTP ${httpInput.method} request completed`,
        nodeId: node.id,
        request: {
          uri: requestUrl,
          method: httpInput.method,
          headers: httpInput.headers,
          ...(httpInput.queryParameters ? { queryParameters: httpInput.queryParameters } : {}),
          ...('payload' in httpInput ? { payload: httpInput.payload } : {}),
        },
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
      output: {
        message: `HTTP ${httpInput.method} request failed`,
        nodeId: node.id,
        request: {
          uri: requestUrl,
          method: httpInput.method,
          headers: httpInput.headers,
          ...(httpInput.queryParameters ? { queryParameters: httpInput.queryParameters } : {}),
          ...('payload' in httpInput ? { payload: httpInput.payload } : {}),
        },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'HTTP_REQUEST_ERROR',
        },
      },
    }
  }
}
