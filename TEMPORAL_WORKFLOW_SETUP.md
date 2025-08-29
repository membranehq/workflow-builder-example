# Temporal Hello World Workflow Setup

This guide explains how to set up and run the "Hello, World!" Temporal workflow in your NextJS application.

## Prerequisites

1. Make sure Temporal is running locally:

   ```bash
   npm run temporal:start
   ```

2. Wait for Temporal services to be ready (check the output for "Services are starting up!")

## Running the Workflow

### Step 1: Start the Worker

In a new terminal, start the Temporal worker that will process the workflow:

```bash
npm run temporal:worker
```

You should see: "Worker started. Listening for tasks..."

### Step 2: Run the Workflow

1. Open your NextJS app in the browser
2. Navigate to a workflow page (e.g., `/workflows/[id]`)
3. Click the "Run Workflow" button
4. The workflow will execute and return "Hello, World!"
5. The result will be displayed below the header

## How It Works

1. **Workflow Definition** (`src/lib/workflows/hello-world.ts`): Defines a simple workflow that calls an activity
2. **Activity** (`src/lib/workflows/activities.ts`): Contains the business logic that returns "Hello, World!"
3. **Worker** (`src/lib/workflows/worker.ts`): Processes workflow tasks and executes activities
4. **API Route** (`src/app/api/workflows/[id]/run/route.ts`): Starts the workflow and waits for completion
5. **UI**: Displays the workflow result when execution completes

## Troubleshooting

- **Worker not starting**: Make sure Temporal is running (`npm run temporal:start`)
- **Connection errors**: Check that Temporal is accessible at `localhost:7233`
- **Workflow not executing**: Ensure the worker is running in a separate terminal

## Next Steps

- Modify the `sayHello` activity in `src/lib/workflows/activities.ts` to return different messages
- Add more complex workflow logic with multiple activities
- Implement error handling and retry logic
- Add workflow parameters and dynamic behavior
