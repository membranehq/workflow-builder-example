import { Connection, Flow, useIntegrationApp } from '@membranehq/react'

export type Action =
  | { type: 'STATE_RESET' }
  | { type: 'FLOW_SELECTED'; payload: Flow }
  | { type: 'PARAMETERS_CHANGED'; payload: Record<string, unknown> }
  | { type: 'NAME_CHANGED'; payload: string }
  | { type: 'SAVING_STARTED' }
  | { type: 'SAVING_COMPLETED' }
  | { type: 'FLOWS_LOADING_STARTED'; payload: Connection }
  | { type: 'FLOWS_LOADING_SUCCEEDED'; payload: { connection: Connection; flows: Flow[] } }
  | { type: 'FLOWS_LOADING_FAILED'; payload: { connection: Connection; error: Error } }
  | { type: 'PARAMETERS_LOADING_STARTED'; payload: { connection: Connection; flow: Flow } }
  | {
      type: 'PARAMETERS_LOADING_SUCCEEDED'
      payload: { connection: Connection; flow: Flow; parameters: Record<string, unknown> }
    }
  | { type: 'PARAMETERS_LOADING_FAILED'; payload: { connection: Connection; flow: Flow; error: Error } }

export interface State {
  connection?: Connection
  flow?: Flow
  parameters: Record<string, unknown>
  name: string
  flows: Flow[]
  isLoadingFlows: boolean
  isLoadingParameters: boolean
  isSaving: boolean
  error?: string
}

export const initialState: State = {
  connection: undefined,
  flow: undefined,
  parameters: {},
  name: '',
  flows: [],
  isLoadingFlows: false,
  isLoadingParameters: false,
  isSaving: false,
  error: undefined,
}

// Reducer function
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'STATE_RESET':
      return initialState

    case 'FLOW_SELECTED':
      return {
        ...state,
        flow: action.payload,
        parameters: {},
        isLoadingParameters: false,
        error: undefined,
      }

    case 'PARAMETERS_CHANGED':
      return {
        ...state,
        parameters: action.payload,
      }

    case 'NAME_CHANGED':
      return {
        ...state,
        name: action.payload,
      }

    case 'SAVING_STARTED':
      return {
        ...state,
        isSaving: true,
      }

    case 'SAVING_COMPLETED':
      return {
        ...state,
        isSaving: false,
      }

    case 'FLOWS_LOADING_STARTED':
      return {
        ...state,
        connection: action.payload,
        flow: undefined,
        parameters: {},
        flows: [],
        isLoadingFlows: true,
        error: undefined,
      }

    case 'FLOWS_LOADING_SUCCEEDED':
      return {
        ...state,
        connection: action.payload.connection,
        flows: action.payload.flows,
        isLoadingFlows: false,
        error: undefined,
      }

    case 'FLOWS_LOADING_FAILED':
      return {
        ...state,
        connection: action.payload.connection,
        flows: [],
        isLoadingFlows: false,
        error: `Failed to load flows: ${action.payload.error.message}`,
      }

    case 'PARAMETERS_LOADING_STARTED':
      return {
        ...state,
        flow: action.payload.flow,
        parameters: {},
        isLoadingParameters: true,
        error: undefined,
      }

    case 'PARAMETERS_LOADING_SUCCEEDED':
      return {
        ...state,
        connection: action.payload.connection,
        flow: action.payload.flow,
        parameters: action.payload.parameters,
        isLoadingParameters: false,
        error: undefined,
      }

    case 'PARAMETERS_LOADING_FAILED':
      return {
        ...state,
        flow: action.payload.flow,
        parameters: {},
        isLoadingParameters: false,
        error: `Failed to load parameters: ${action.payload.error.message}`,
      }

    default:
      return state
  }
}

// TODO: replace with swr / react-query
// Action creators for async operations
export const useTriggerActions = (
  integrationApp: ReturnType<typeof useIntegrationApp>,
  dispatch: React.Dispatch<Action>,
) => {
  const loadFlows = async (connection: Connection) => {
    if (!connection?.integration?.id) return

    dispatch({ type: 'FLOWS_LOADING_STARTED', payload: connection })

    try {
      const flowsList = await integrationApp.integration(connection.integration.id).flows.list()
      dispatch({
        type: 'FLOWS_LOADING_SUCCEEDED',
        payload: { connection, flows: flowsList.items },
      })
    } catch (error) {
      dispatch({
        type: 'FLOWS_LOADING_FAILED',
        payload: { connection, error: error as Error },
      })
    }
  }

  const loadFlowParameters = async (connection: Connection, flow: Flow) => {
    if (!connection?.id || !flow?.id) return

    dispatch({ type: 'PARAMETERS_LOADING_STARTED', payload: { connection, flow } })

    try {
      const customerFlow = await integrationApp.connection(connection.id).flow(flow.id).get()
      dispatch({
        type: 'PARAMETERS_LOADING_SUCCEEDED',
        payload: {
          connection,
          flow,
          parameters: customerFlow.parameters || {},
        },
      })
    } catch (error) {
      dispatch({
        type: 'PARAMETERS_LOADING_FAILED',
        payload: { connection, flow, error: error as Error },
      })
    }
  }

  return { loadFlows, loadFlowParameters }
}
