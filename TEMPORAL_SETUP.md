# Temporal.io Setup Guide

This guide explains how to set up and configure Temporal.io for your application.

## Prerequisites

- Node.js 18+
- npm or yarn
- Docker (for running Temporal locally)

## Installation

The required Temporal packages have been installed:

```bash
npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
```

## Configuration

### 1. Environment Variables

Copy `temporal.config.example` to `.env.local` and configure:

```bash
# Temporal Server
TEMPORAL_HOST=localhost
TEMPORAL_PORT=7233
TEMPORAL_NAMESPACE=default

# For Temporal Cloud
# TEMPORAL_CLOUD_URL=your-namespace.tmprl.cloud
# TEMPORAL_CLOUD_CERT_PATH=/path/to/cert.pem
# TEMPORAL_CLOUD_KEY_PATH=/path/to/key.pem
```

### 2. Running Temporal Locally

#### Option A: Using Docker Compose (Recommended)

Create `docker-compose.temporal.yml`:

```yaml
version: '3.8'
services:
  temporal:
    image: temporalio/auto-setup:1.22.3
    ports:
      - '7233:7233'
    environment:
      - DB=postgresql
      - DB_PORT=5432
      - POSTGRES_USER=temporal
      - POSTGRES_PWD=temporal
      - POSTGRES_DB=temporal
      - DYNAMIC_CONFIG_FILE_PATH=config/dynamicconfig/development-sql.yaml
    volumes:
      - ./temporal-config:/etc/temporal/config/dynamicconfig
    depends_on:
      - postgresql
      - elasticsearch
    networks:
      - temporal-network

  postgresql:
    image: postgres:13
    environment:
      - POSTGRES_PASSWORD=temporal
      - POSTGRES_USER=temporal
      - POSTGRES_DB=temporal
    ports:
      - '5432:5432'
    volumes:
      - postgresql-data:/var/lib/postgresql/data
    networks:
      - temporal-network

  elasticsearch:
    image: opensearch:1.3.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - '9200:9200'
      - '9600:9600'
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - temporal-network

  temporal-web:
    image: temporalio/web:1.15.0
    environment:
      - TEMPORAL_GRPC_ENDPOINT=temporal:7233
      - TEMPORAL_PERMIT_WRITE_API=true
    ports:
      - '8088:8088'
    depends_on:
      - temporal
    networks:
      - temporal-network

volumes:
  postgresql-data:
  elasticsearch-data:

networks:
  temporal-network:
    driver: bridge
```

Run with:

```bash
docker-compose -f docker-compose.temporal.yml up -d
```

#### Option B: Using Temporal CLI

1. Install Temporal CLI:

```bash
# macOS
brew install temporal

# Or download from: https://github.com/temporalio/cli/releases
```

2. Start Temporal server:

```bash
temporal server start-dev
```

### 3. Verify Installation

- Temporal server: http://localhost:7233
- Temporal Web UI: http://localhost:8088

## Current Setup

### What's Implemented

1. **Temporal Client** (`src/lib/temporal.ts`)
   - Basic connection to Temporal server
   - Client instance management
   - Environment variable configuration

### What's NOT Implemented (Yet)

- Workflow definitions
- Workflow activities
- Worker management
- Workflow execution
- Integration with your app

## Testing the Connection

You can test that Temporal is working by creating a simple test script:

```typescript
// test-temporal-connection.ts
import { getTemporalClient } from './src/lib/temporal'

async function testConnection() {
  try {
    const client = await getTemporalClient()
    console.log('✅ Successfully connected to Temporal!')
    console.log('Client namespace:', client.namespace)
  } catch (error) {
    console.error('❌ Failed to connect to Temporal:', error)
  }
}

testConnection()
```

## Next Steps

When you're ready to implement workflow functionality:

1. **Add Workflow Definitions**: Define your workflow logic
2. **Implement Activities**: Create the actual work functions
3. **Set Up Workers**: Configure workers to execute workflows
4. **Integrate with App**: Connect workflow execution to your UI

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check Temporal server is running
   - Verify host/port configuration
   - Check firewall settings

2. **Port Already in Use**
   - Check if another service is using port 7233
   - Stop conflicting services or change ports

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=debug
```

## Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [Temporal TypeScript SDK](https://typescript.temporal.io/)
- [Temporal Samples](https://github.com/temporalio/samples-typescript)
- [Temporal Web UI](https://github.com/temporalio/web)
