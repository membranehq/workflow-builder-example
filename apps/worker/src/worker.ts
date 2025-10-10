import 'dotenv/config'
import { NativeConnection, Worker } from '@temporalio/worker'
import * as activities from '@repo/shared/temporal/activities'
import { TEMPORAL_CONFIG } from '@repo/shared'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

export async function runWorker(): Promise<void> {
  console.log('✨ Spinning up worker')

  const connection = await NativeConnection.connect({
    address: TEMPORAL_CONFIG.ADDRESS,
    apiKey: TEMPORAL_CONFIG.API_KEY,
    tls: true,
  })

  try {
    const worker = await Worker.create({
      connection,
      activities,
      workflowsPath: require.resolve('@repo/shared/temporal/workflows'),
      taskQueue: TEMPORAL_CONFIG.TASK_QUEUE_NAME,
      namespace: TEMPORAL_CONFIG.NAMESPACE,
      maxConcurrentWorkflowTaskExecutions: 10,
    })

    console.log('Worker started. Listening for tasks...')

    await worker.run()
  } catch (error) {
    console.error(' Worker failed to start:', error)

    await connection.close()
  }
}

runWorker().catch((error) => {
  console.error('Worker failed to start:', error)
  process.exit(1)
})
