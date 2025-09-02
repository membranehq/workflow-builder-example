import { Client, Connection } from '@temporalio/client'
import { TEMPORAL_CONFIG } from './config'

async function createTemporalConnection(): Promise<Connection> {
  try {
    return await Connection.connect({
      address: TEMPORAL_CONFIG.ADDRESS,
    })
  } catch (error) {
    throw new Error(
      `Failed to connect to Temporal at ${TEMPORAL_CONFIG.ADDRESS} - ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function createTemporalClient(): Promise<Client> {
  const connection = await createTemporalConnection()

  return new Client({
    connection,
  })
}
