import { Worker } from '@temporalio/worker'
import { createTemporalConnection } from '../temporal'
import { helloWorldWorkflow } from './index'

export async function runWorker(): Promise<void> {
  await createTemporalConnection()

  const worker = await Worker.create({
    workflowsPath: require.resolve('./index'),
    taskQueue: 'hello-world-queue',
  })

  console.log('Worker started. Listening for tasks...')
  await worker.run()
}

// Export for use in other parts of the application
export { helloWorldWorkflow }
