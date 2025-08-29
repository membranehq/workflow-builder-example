#!/usr/bin/env node

// Simple test script to verify Temporal connection
import { getTemporalClient } from '../src/lib/temporal.ts'

async function testConnection() {
  console.log('🔌 Testing Temporal connection...')

  try {
    const client = await getTemporalClient()
    console.log('✅ Successfully connected to Temporal!')
    console.log('📊 Client namespace:', client.namespace)
    console.log('🌐 Connection established')

    // Test basic client functionality
    console.log('🔍 Testing client methods...')
    console.log('   - Client instance:', typeof client)
    console.log('   - Workflow methods available:', typeof client.workflow)
    console.log('   - Connection status:', client.connection ? 'Connected' : 'Not connected')

    console.log('\n🎉 Temporal is ready to use!')
  } catch (error) {
    console.error('❌ Failed to connect to Temporal:')
    console.error('   Error:', error.message)
    console.error('\n🔧 Troubleshooting tips:')
    console.error('   1. Make sure Temporal server is running')
    console.error('   2. Check your environment variables')
    console.error('   3. Verify the server is accessible at the configured host/port')
    console.error('   4. Run: npm run temporal:start')

    process.exit(1)
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('\n✨ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error)
    process.exit(1)
  })
