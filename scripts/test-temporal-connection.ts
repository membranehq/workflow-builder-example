#!/usr/bin/env node

// Simple test script to verify Temporal connection
import { createTemporalClient } from '../src/lib/temporal/client'

async function testConnection() {
  console.log('🔌 Testing Temporal connection...')

  try {
    const client = await createTemporalClient()
    console.log('✅ Successfully created Temporal client!')

    // Test actual connection health
    console.log('🔍 Testing connection health...')

    await client.connection.ensureConnected()

    console.log('✅ Connection verified and healthy!')

    console.log('\n🎉 Temporal is ready to use!')

    client.connection.close()
  } catch (error) {
    console.error('❌ Failed to connect to Temporal:')
    console.error('   Error:', error instanceof Error ? error.message : 'Unknown error')
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
