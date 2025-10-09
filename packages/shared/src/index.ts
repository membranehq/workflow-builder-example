// Lib exports
export { connectToDatabase } from './lib/mongodb.js'

export { WorkflowRun } from './models/workflow-run.js'
export type { IWorkflowRun, IWorkflowRunResult, IWorkflowRunDocument } from './models/workflow-run.js'

// Temporal exports
export { createTemporalClient } from './temporal/client.js'
export { TEMPORAL_CONFIG } from './temporal/config.js'
export { executeWorkflow } from './temporal/workflows.js'
export { executeWorkflowNodes, activityRetryPolicy } from './temporal/activities.js'
export type { WorkflowNode, NodeType, TriggerType, ActionNodeType, HttpMethod, NodeExecutionResult, ActivityResult, HttpActivityResult, FilterActivityResult, WorkflowDefinition } from './temporal/types.js'
export type { EnhancedNodeExecutionResult } from './temporal/node-execution.js'
