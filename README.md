# Integration Use Case Template

This is a template for an application showcasing Workflow Execution capabilities using [Integration.app](https://integration.app) and [temporal.io](https://temporal.io). The app is built with Next.js.

## Prerequisites

- Node.js 18+ installed
- Integration.app workspace credentials (Workspace Key and Secret)
- mongoDB (for local workflow storage)
- Docker installed (to host temporal server)
- Pnpm installed

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

**Note: This is a monorepo with separate apps. You need to configure environment variables for both the web app and the worker app.**

```bash
# Copy the sample environment file for the web app
cp apps/web/.env-example apps/web/.env

# Copy the sample environment file for the worker app
cp apps/worker/.env-example apps/worker/.env
```

4. Edit both `.env` files and add your Integration.app credentials and other settings:
   - `apps/web/.env` - Environment variables for the Next.js web application
   - `apps/worker/.env` - Environment variables for the Temporal worker

You can find these credentials in your Integration.app workspace settings.

## Running the Application

1. Start the development server (this starts both the Next.js web app and the Temporal worker):

```bash
pnpm dev
```

**Note:** The Temporal worker is a background service that executes your workflow tasks. It polls Temporal for work and runs the activities and workflows you define.

2. Open [http://localhost:3000](http://localhost:3000) in your browser to access the Next.js web application.

## How event from Integration works

This application receives events from different integrations (like Salesforce, HubSpot, etc.) through Membrane flows. Here's how it works:

### Membrane Flow Construction

When you configure an event trigger in a workflow, the application automatically creates a Membrane flow instance with the following nodes:

1. **Trigger Node** - Listens for events (created/updated/deleted) on a specific data collection
2. **Find Data Record Node** - Fetches the complete record details by ID
3. **API Request Node** - Sends the event data to your application's webhook endpoint

This flow ensures that whenever an event occurs in the connected integration, this application receives the complete record data.

### Event Ingestion

Events are received at the `/api/ingest-event` endpoint, which:

- Validates the incoming request using Integration.app token verification
- Looks up the target workflow and verifies it's active
- Creates a workflow run record in MongoDB
- Starts a Temporal workflow execution to process the event
- Returns immediately with a 202 Accepted response (async processing)

### Code References

- **Flow Instance Creation**: [`apps/web/src/app/api/workflows/[id]/nodes/route.ts`](apps/web/src/app/api/workflows/[id]/nodes/route.ts) - See the `createFlowInstance` function (lines 18-86) that constructs the Membrane flow with all necessary nodes
- **Event Ingestion Endpoint**: [`apps/web/src/app/api/ingest-event/route.ts`](apps/web/src/app/api/ingest-event/route.ts) - Handles incoming webhook events and triggers workflow execution
- **Event Trigger Configuration UI**: [`apps/web/src/app/workflows/[id]/components/configs/event-trigger-config.tsx`](apps/web/src/app/workflows/[id]/components/configs/event-trigger-config.tsx) - The UI component for configuring event triggers

## License

MIT
