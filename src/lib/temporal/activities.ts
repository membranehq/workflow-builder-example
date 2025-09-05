import { ObjectId } from 'mongodb'

import { connectToDatabase } from '../mongodb'
import type { WorkflowNode, HttpNodeInput } from './types'
import { HttpNodeData } from '@/app/workflows/[id]/components/types/workflow'

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
      output: {
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
      },
    }
  } catch (error) {
    return {
      output: {
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
      },
    }
  }
}
