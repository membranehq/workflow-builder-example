#!/usr/bin/env node

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { spawn } from 'child_process'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

// Start the workers using tsx to run TypeScript directly
async function main() {
  try {
    // Load environment variables from .env file
    const envPath = join(__dirname, '..', '.env')
    config({ path: envPath })
    console.log('1. Environment variables loaded from .env file')

    console.log('2. Starting Temporal workers...')

    // Get the path to the worker source file
    const workerPath = join(__dirname, '..', 'src', 'lib', 'workflows', 'worker.ts')

    // Start the worker using tsx
    console.log('Starting worker with tsx...')
    const worker = spawn('npx', ['tsx', workerPath], {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
      env: {
        ...process.env,
        MONGODB_URI: process.env.MONGODB_URI,
        INTEGRATION_APP_WORKSPACE_KEY: process.env.INTEGRATION_APP_WORKSPACE_KEY,
        INTEGRATION_APP_WORKSPACE_SECRET: process.env.INTEGRATION_APP_WORKSPACE_SECRET,
      },
    })

    worker.on('error', (error) => {
      console.error('Worker error:', error)
      process.exit(1)
    })

    worker.on('close', (code) => {
      console.log(`Worker process exited with code ${code}`)
      process.exit(code || 0)
    })
  } catch (error) {
    console.error('Failed to start workers:', error)
    process.exit(1)
  }
}

main()
