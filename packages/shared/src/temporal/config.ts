import { z } from 'zod'

const temporalEnvVarsSchema = z.object({
  TEMPORAL_SERVER_HOST: z.string().default('localhost'),
  TEMPORAL_TASK_QUEUE_NAME: z.string().default('workflow-queue'),
  TEMPORAL_API_KEY: z.string().default(''),
  TEMPORAL_NAMESPACE: z.string().default('default'),
})

const envVars = temporalEnvVarsSchema.parse(process.env)

export const TEMPORAL_CONFIG = {
  ADDRESS: `${envVars.TEMPORAL_SERVER_HOST}:7233`,
  TASK_QUEUE_NAME: envVars.TEMPORAL_TASK_QUEUE_NAME,
  API_KEY: envVars.TEMPORAL_API_KEY,
  NAMESPACE: envVars.TEMPORAL_NAMESPACE,
} as const


