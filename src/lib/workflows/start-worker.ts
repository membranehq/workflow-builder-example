import { runWorker } from './worker'

// TODO: this file is not being used...
async function main() {
  try {
    console.log('Starting Temporal worker...')
    await runWorker()
  } catch (error) {
    console.error('Failed to start worker:', error)
    process.exit(1)
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main()
}
