import { Worker } from '@temporalio/worker'
import { createTemporalConnection } from '../temporal'
import * as activities from './activities'
import { helloWorldWorkflow } from './hello-world'

export async function runWorker(): Promise<void> {
  const connection = await createTemporalConnection()

  const worker = await Worker.create({
    workflowsPath: require.resolve('./hello-world'),
    activities,
    taskQueue: 'hello-world-queue',
  })

  console.log('Worker started. Listening for tasks...')
  await worker.run()
}

// Export for use in other parts of the application
export { helloWorldWorkflow, activities }
