import { NativeConnection, Worker } from '@temporalio/worker'
import * as activities from './activities'
import { TEMPORAL_CONFIG } from '../temporal'
import { integrationWorkflow } from './integration-workflow'

export async function runWorker(): Promise<void> {
  const connection = await NativeConnection.connect({
    address: `${TEMPORAL_CONFIG.HOST}:${TEMPORAL_CONFIG.PORT}`,
  })

  try {
    const worker = await Worker.create({
      connection,
      workflowsPath: require.resolve('./integration-workflow'),
      activities,
      // TODO: have this queue be configurable
      taskQueue: 'workflow-queue',
    })

    console.log('Worker started. Listening for tasks...')
    await worker.run()
  } catch (error) {
    console.error('Worker failed to start:', error)

    await connection.close()
  }
}

// TODO: have single export for all workflows
// Export for use in other parts of the application
export { activities, integrationWorkflow }

// Run the worker only when this very file is executed
if (import.meta.url === `file://${process.argv[1]}`) {
  runWorker().catch((error) => {
    console.error('Worker failed to start:', error)
    process.exit(1)
  })
}
