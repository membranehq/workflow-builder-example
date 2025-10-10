// Lib exports
export { connectToDatabase } from './lib/mongodb'

export { WorkflowRun } from './models/workflow-run'
export type { IWorkflowRun, IWorkflowRunResult, IWorkflowRunDocument } from './models/workflow-run'

// Temporal exports
export { createTemporalClient } from './temporal/client'
export { TEMPORAL_CONFIG } from './temporal/config'
export { executeWorkflow } from './temporal/workflows'
export { executeWorkflowNodes, activityRetryPolicy } from './temporal/activities'
export type {
  WorkflowNode,
  NodeType,
  TriggerType,
  ActionNodeType,
  HttpMethod,
  NodeExecutionResult,
  ActivityResult,
  HttpActivityResult,
  FilterActivityResult,
  WorkflowDefinition,
} from './temporal/types'
export type { EnhancedNodeExecutionResult } from './temporal/node-execution'
