import { Client, Connection } from '@temporalio/client'
import { z } from 'zod'

const temporalEnvVarsSchema = z.object({
  TEMPORAL_SERVER_HOST: z.string().default('localhost'),
  TEMPORAL_TASK_QUEUE_NAME: z.string().default('workflow-queue'),
})

const envVars = temporalEnvVarsSchema.parse(process.env)

// Basic Temporal configuration constants
export const TEMPORAL_CONFIG = {
  ADDRESS: `${envVars.TEMPORAL_SERVER_HOST}:7233`,
  TASK_QUEUE_NAME: envVars.TEMPORAL_TASK_QUEUE_NAME,
} as const

// Create Temporal connection
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

// Create Temporal client
export async function createTemporalClient(): Promise<Client> {
  const connection = await createTemporalConnection()

  return new Client({
    connection,
  })
}
