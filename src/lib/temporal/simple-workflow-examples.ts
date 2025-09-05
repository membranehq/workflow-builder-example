import type { WorkflowDefinition } from './types'

/**
 * Simple Workflow Examples using Direct Result Passing
 *
 * This demonstrates how to use Solution 1 for simple linear and branching workflows
 * where data flows from one node to the next without complex dependencies.
 */

// Example 1: Simple Linear Workflow
// Trigger → Create User → Send Email → Update Database
export const userOnboardingWorkflow: WorkflowDefinition = {
  id: 'user-onboarding-001',
  name: 'User Onboarding',
  nodes: [
    {
      id: 'trigger',
      name: 'User Registration Trigger',
      type: 'trigger',
      inputMapping: {
        email: 'user@example.com',
        name: 'John Doe',
      },
    },
    {
      id: 'sendWelcomeEmail',
      name: 'Send Welcome Email',
      type: 'http',
      inputMapping: {
        uri: 'https://api.emailservice.com/send',
        method: 'POST',
        headers: {
          Authorization: 'Bearer email-api-token',
          'Content-Type': 'application/json',
        },
        payload: {
          // This will receive the previous node's output directly
          // The user data becomes the email payload
        },
      },
    },
    {
      id: 'updateUserProfile',
      name: 'Update User Profile',
      type: 'transform',
      inputMapping: {
        // This will receive the previous node's output directly
        // Transform the data for profile creation
      },
    },
    {
      id: 'notifyExternalService',
      name: 'Notify External Service',
      type: 'http',
      inputMapping: {
        uri: 'https://api.example.com/webhook',
        method: 'POST',
        headers: {
          Authorization: 'Bearer your-token-here',
          'X-Custom-Header': 'workflow-notification',
        },
        payload: {
          // This will receive the previous node's output directly
          // The entire previous output becomes the payload
        },
      },
    },
  ],
}

// Example 2: HTTP API Workflow
// Trigger → Fetch Data → Transform → Send to API → Log Result
export const httpApiWorkflow: WorkflowDefinition = {
  id: 'http-api-001',
  name: 'HTTP API Integration',
  nodes: [
    {
      id: 'trigger',
      name: 'API Request Trigger',
      type: 'trigger',
      inputMapping: {
        userId: 'user123',
        action: 'fetch-profile',
      },
    },
    {
      id: 'fetchUserData',
      name: 'Fetch User Data',
      type: 'http',
      inputMapping: {
        uri: 'https://api.userservice.com/users/{{userId}}',
        method: 'GET',
        headers: {
          Authorization: 'Bearer {{apiToken}}',
          Accept: 'application/json',
        },
      },
    },
    {
      id: 'transformData',
      name: 'Transform Data',
      type: 'transform',
      inputMapping: {
        // This will receive the HTTP response directly
      },
    },
    {
      id: 'sendToExternalApi',
      name: 'Send to External API',
      type: 'http',
      inputMapping: {
        uri: 'https://external-api.com/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '{{externalApiKey}}',
        },
        payload: {
          // This will receive the transformed data directly
        },
      },
    },
    {
      id: 'logResult',
      name: 'Log Result',
      type: 'transform',
      inputMapping: {
        // This will receive the API response directly
        // Transform and log the result
      },
    },
  ],
}

// Example 3: Simple Branching Workflow
// Trigger → Process Order → [Send Email OR Send SMS] → Update Status
export const orderProcessingWorkflow: WorkflowDefinition = {
  id: 'order-processing-001',
  name: 'Order Processing',
  nodes: [
    {
      id: 'trigger',
      name: 'Order Created',
      type: 'trigger',
      inputMapping: {
        customerId: 'cust-123',
        amount: 99.99,
        items: ['item1', 'item2'],
      },
    },
    {
      id: 'processOrder',
      name: 'Process Order',
      type: 'transform',
      inputMapping: {
        // This will receive the previous node's output directly
        // Transform order data for processing
      },
    },
    {
      id: 'sendNotification',
      name: 'Send Order Notification',
      type: 'http',
      inputMapping: {
        uri: 'https://api.notificationservice.com/send',
        method: 'POST',
        headers: {
          Authorization: 'Bearer notification-token',
          'Content-Type': 'application/json',
        },
        payload: {
          // This will receive the processed order data directly
          // Send as notification payload
        },
      },
    },
  ],
}

// Example 3: Data Transformation Workflow
// Fetch Data → Transform → Save → Notify
export const dataProcessingWorkflow: WorkflowDefinition = {
  id: 'data-processing-001',
  name: 'Data Processing',
  nodes: [
    {
      id: 'fetchData',
      name: 'Fetch Raw Data',
      type: 'http',
      inputMapping: {
        uri: 'https://api.datasource.com/raw-data',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    },
    {
      id: 'transformData',
      name: 'Transform Data',
      type: 'transform',
      inputMapping: {
        // This will receive the previous node's output directly
        // No templating or mapping needed
      },
    },
    {
      id: 'saveData',
      name: 'Save Processed Data',
      type: 'http',
      inputMapping: {
        uri: 'https://api.databaseservice.com/save',
        method: 'POST',
        headers: {
          Authorization: 'Bearer database-token',
          'Content-Type': 'application/json',
        },
        payload: {
          // This will receive the transformed data directly
          // Save to database
        },
      },
    },
  ],
}

/**
 * Simple Data Flow
 *
 * Each node receives the output from the previous node as its input.
 * No templating, mapping, or complex data transformation needed.
 *
 * Example:
 * Node 1 outputs: { email: 'user@example.com', name: 'John' }
 * Node 2 receives: { email: 'user@example.com', name: 'John' }
 * Node 2 outputs: { message: 'Welcome John!' }
 * Node 3 receives: { message: 'Welcome John!' }
 */

/**
 * Best Practices for Simple Workflows
 */
export const bestPractices = {
  naming: {
    description: 'Use clear, descriptive node names',
    examples: ['User Registration Trigger', 'Send Welcome Email', 'Process Payment', 'Update Database Record'],
  },

  dataFlow: {
    description: 'Design clear data flow between nodes',
    patterns: ['Trigger → Process → Notify', 'Fetch → Transform → Save', 'Create → Validate → Send'],
  },

  simplicity: {
    description: 'Keep it simple',
    strategies: [
      'Each node does one thing',
      'Data flows directly from node to node',
      'No complex templating or mapping',
      'Easy to understand and debug',
    ],
  },
}
