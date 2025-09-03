import { useEffect, useReducer } from 'react'
import { useConnections, useIntegrationApp, Connection, Flow } from '@membranehq/react'
import { DataSchema } from '@membranehq/sdk'
import { WorkflowNode } from '../../types/workflow'
import { getIntegrationName } from '../../utils'
import { type Action, type State, reducer, useTriggerActions, initialState } from './trigger-dialog.reducer'

export function useTriggerDialogState() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return { state, dispatch }
}

export function useTriggerDialogData() {
  const { items: connections } = useConnections()
  const integrationApp = useIntegrationApp()

  return { connections, integrationApp }
}

export function useTriggerDialogActions(
  integrationApp: ReturnType<typeof useIntegrationApp>,
  dispatch: React.Dispatch<Action>,
) {
  return useTriggerActions(integrationApp, dispatch)
}

export function useTriggerDialogEffects(
  open: boolean,
  mode: 'create' | 'edit',
  node: WorkflowNode | undefined,
  connections: Connection[],
  state: State,
  dispatch: React.Dispatch<Action>,
  loadFlows: (connection: Connection) => Promise<void>,
  loadFlowParameters: (connection: Connection, flow: Flow) => Promise<void>,
) {
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      dispatch({ type: 'STATE_RESET' })
    }
  }, [dispatch, open])

  // Load initial data in edit mode
  useEffect(() => {
    if (mode === 'edit' && node && connections) {
      const connection = connections.find((c) => c.id === node.connectionId)
      if (connection) {
        dispatch({ type: 'NAME_CHANGED', payload: node.name })
        loadFlows(connection)
      }
    }
  }, [mode, node, connections, loadFlows, dispatch])

  // Handle loading specific flow in edit mode after flows are loaded
  useEffect(() => {
    if (mode === 'edit' && node?.flowKey && state.flows.length > 0 && state.connection) {
      const flow = state.flows.find((f) => f.key === node.flowKey)

      if (flow) {
        dispatch({ type: 'FLOW_SELECTED', payload: flow })
        loadFlowParameters(state.connection, flow)
      }
    }
  }, [mode, node?.flowKey, state.flows, state.connection, loadFlowParameters, dispatch])
}

export function useTriggerDialogHandlers(
  mode: 'create' | 'edit',
  connections: Connection[],
  state: State,
  dispatch: React.Dispatch<Action>,
  loadFlows: (connection: Connection) => Promise<void>,
  loadFlowParameters: (connection: Connection, flow: Flow) => Promise<void>,
  integrationApp: ReturnType<typeof useIntegrationApp>,
  node: WorkflowNode | undefined,
  onSubmit: (node: Omit<WorkflowNode, 'id'>) => void,
) {
  const handleIntegrationChange = (connectionId: string) => {
    console.log('handleIntegrationChange', connectionId)

    const connection = connections?.find((c) => c.id === connectionId)
    if (!connection?.integration?.id) return

    // Clear name in create mode
    if (mode === 'create') {
      dispatch({ type: 'NAME_CHANGED', payload: '' })
    }

    loadFlows(connection)
  }

  const handleTriggerChange = async (triggerKey: string) => {
    const flow = state.flows.find((f) => f.key === triggerKey)
    if (!flow || !state.connection) return

    dispatch({ type: 'FLOW_SELECTED', payload: flow })

    // Auto-generate name in create mode
    if (mode === 'create') {
      const connectionName = getIntegrationName(state.connection)
      const flowName = flow.name || flow.key
      dispatch({ type: 'NAME_CHANGED', payload: `${connectionName} - ${flowName}` })
    }

    loadFlowParameters(state.connection, flow)
  }

  const handleParameterChange = (parameters: Record<string, unknown>) => {
    dispatch({ type: 'PARAMETERS_CHANGED', payload: parameters })
  }

  const handleSubmit = async () => {
    if (!state.connection?.id || !state.flow?.id) return

    dispatch({ type: 'SAVING_STARTED' })

    try {
      await integrationApp.connection(state.connection.id).flow(state.flow.id).patch({
        parameters: state.parameters,
      })

      onSubmit({
        name: state.name,
        type: 'trigger',
        integrationKey: state.connection.integration?.key || '',
        connectionId: state.connection.id,
        flowKey: state.flow.key || '',
        parametersSchema: state.flow.parametersSchema as DataSchema,
        instanceKey: node?.instanceKey || '12',
        actionKey: state.flow.key || '',
        inputMapping: node?.inputMapping || {},
      })

      dispatch({ type: 'STATE_RESET' })
    } catch (error) {
      console.error('Failed to save trigger:', error)
    } finally {
      dispatch({ type: 'SAVING_COMPLETED' })
    }
  }

  return {
    handleIntegrationChange,
    handleTriggerChange,
    handleParameterChange,
    handleSubmit,
  }
}
