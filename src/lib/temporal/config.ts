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
