import 'dotenv/config'
import { NativeConnection, Worker } from '@temporalio/worker'
import * as activities from './activities.js'
import { TEMPORAL_CONFIG } from './config.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function runWorker(): Promise<void> {
  const connection = await NativeConnection.connect({
    address: TEMPORAL_CONFIG.ADDRESS,
    apiKey: TEMPORAL_CONFIG.API_KEY,
    tls: true,
  })

  try {
    const worker = await Worker.create({
      connection,
      activities,
      workflowsPath: path.resolve(__dirname, './workflows.js'),
      taskQueue: TEMPORAL_CONFIG.TASK_QUEUE_NAME,
      namespace: TEMPORAL_CONFIG.NAMESPACE,
      maxConcurrentWorkflowTaskExecutions: 10,
    })

    console.log('Worker started. Listening for tasks...')

    await worker.run()
  } catch (error) {
    console.error('Worker failed to start:', error)

    await connection.close()
  }
}

runWorker().catch((error) => {
  console.error('Worker failed to start:', error)
  process.exit(1)
})
