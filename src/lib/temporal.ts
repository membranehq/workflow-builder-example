import { Client, Connection } from '@temporalio/client'

// Temporal connection configuration
const TEMPORAL_HOST = process.env.TEMPORAL_HOST || 'localhost'
const TEMPORAL_PORT = parseInt(process.env.TEMPORAL_PORT || '7233', 10)
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default'

// Create Temporal connection
export async function createTemporalConnection(): Promise<Connection> {
  try {
    return await Connection.connect({
      address: `${TEMPORAL_HOST}:${TEMPORAL_PORT}`,
    })
  } catch (error) {
    throw new Error(
      `Failed to connect to Temporal at ${TEMPORAL_HOST}:${TEMPORAL_PORT}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

// Create Temporal client
export async function createTemporalClient(): Promise<Client> {
  const connection = await createTemporalConnection()

  return new Client({
    connection,
    namespace: TEMPORAL_NAMESPACE,
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
  HOST: TEMPORAL_HOST,
  PORT: TEMPORAL_PORT,
} as const
