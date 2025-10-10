import { Client, Connection } from '@temporalio/client'
import { TEMPORAL_CONFIG } from './config.js'

async function createTemporalConnection(): Promise<Connection> {
  try {
    return await Connection.connect({
      address: TEMPORAL_CONFIG.ADDRESS,
      apiKey: TEMPORAL_CONFIG.API_KEY,
      tls: true,
    })
  } catch (error) {
    throw new Error(
      `Failed to connect to Temporal at ${TEMPORAL_CONFIG.ADDRESS} - ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function createTemporalClient() {
  const connection = await createTemporalConnection()

  return new Client({
    connection,
    namespace: TEMPORAL_CONFIG.NAMESPACE,
  })
}
