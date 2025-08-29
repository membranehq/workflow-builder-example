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
```

### 2. Running Temporal Locally

#### Option A: Using Docker Compose (Recommended)

The `docker-compose.temporal.yml` file is already configured with:

```yaml
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
      - POSTGRES_SEEDS=postgresql
    depends_on:
      - postgresql

  postgresql:
    image: postgres:13
    environment:
      - POSTGRES_PASSWORD=temporal
      - POSTGRES_USER=temporal
      - POSTGRES_DB=temporal
    ports:
      - '5432:5432'
```

Run with:

```bash
npm run temporal:start
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
- PostgreSQL: localhost:5432

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

You can test that Temporal is working using the npm scripts:

```bash
# Start Temporal services
npm run temporal:start

# Test the connection
npm run temporal:test

# View logs if needed
npm run temporal:logs

# Stop services when done
npm run temporal:stop
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
