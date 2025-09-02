import { Client, Connection } from '@temporalio/client'

// Temporal connection configuration
// TODO: add zod schema and add loading env variables in one place and reusing
const TEMPORAL_HOST = process.env.TEMPORAL_SERVER_HOST || 'localhost'
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default'
const TEMPORAL_TASK_QUEUE_NAME = process.env.TEMPORAL_TASK_QUEUE_NAME || 'workflow-queue'

const TEMPORAL_ADDRESS = `${TEMPORAL_HOST}:7233`

// Create Temporal connection
async function createTemporalConnection(): Promise<Connection> {
  try {
    return await Connection.connect({
      address: TEMPORAL_ADDRESS,
    })
  } catch (error) {
    throw new Error(
      `Failed to connect to Temporal at ${TEMPORAL_ADDRESS} - ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

// Create Temporal client
export async function createTemporalClient(): Promise<Client> {
  const connection = await createTemporalConnection()

  return new Client({
    connection,
  })
}

// Get Temporal client instance (singleton pattern)
let temporalClient: Client | null = null

export async function getTemporalClient(): Promise<Client> {
  if (!temporalClient) {
    temporalClient = await createTemporalClient()
  }

  return temporalClient
}

// Close Temporal connection
export async function closeTemporalConnection(): Promise<void> {
  if (temporalClient) {
    await temporalClient.connection.close()
    temporalClient = null
  }
}

// Basic Temporal configuration constants
export const TEMPORAL_CONFIG = {
  NAMESPACE: TEMPORAL_NAMESPACE,
  ADDRESS: TEMPORAL_ADDRESS,
  TASK_QUEUE_NAME: TEMPORAL_TASK_QUEUE_NAME,
} as const
