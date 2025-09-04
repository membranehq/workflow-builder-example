# Simple Workflow Data Flow Guide

This guide explains how to use **Solution 1: Direct Result Passing** for simple linear and branching workflows in any workflow system. This approach is framework-agnostic and can be adapted to work with Temporal, AWS Step Functions, Azure Logic Apps, or any other workflow orchestration platform.

## How It Works

The system automatically passes the result from each node to the next node by enriching the input mapping with data from the previous node's result.

### Data Available in Each Node

Every node (except the first) has access to:

- `{{previousResult}}` - The complete output from the previous node
- `{{previousId}}` - The ID from the previous result (if available)
- `{{previousStatus}}` - The status from the previous result (if available)
- `{{previousData}}` - The data field from the previous result (if available)
- `{{previousFullResult}}` - The complete previous result object

## Usage Examples

### Basic Data Passing

```typescript
// Node 1: Create User
{
  id: 'createUser',
  inputMapping: {
    email: 'user@example.com',
    name: 'John Doe'
  }
}

// Node 2: Send Email (automatically gets previous result)
{
  id: 'sendEmail',
  inputMapping: {
    to: '{{previousResult.email}}',        // Gets 'user@example.com'
    subject: 'Welcome {{previousResult.name}}!', // Gets 'Welcome John Doe!'
    userId: '{{previousId}}'               // Gets the user ID
  }
}
```

### Nested Object Access

```typescript
// If previous result has nested data:
// { output: { customer: { email: 'user@example.com', name: 'John' } } }

{
  id: 'sendNotification',
  inputMapping: {
    to: '{{previousResult.customer.email}}',
    name: '{{previousResult.customer.name}}'
  }
}
```

### String Interpolation

```typescript
{
  id: 'sendOrderConfirmation',
  inputMapping: {
    subject: 'Order #{{previousId}} Confirmation',
    body: 'Hello {{previousResult.customer.name}}, your order for ${{previousResult.total}} has been confirmed.'
  }
}
```

## Workflow Patterns

### 1. Linear Workflow

```
Trigger → Process → Notify → Update
```

Each node receives data from the immediately previous node.

### 2. Simple Branching

```
Trigger → Process → [Email OR SMS] → Update
```

Both branches receive data from the same previous node.

### 3. Data Transformation

```
Fetch → Transform → Save → Notify
```

Data flows through transformation steps with each node building on the previous.

## Implementation Details

### Automatic Data Enrichment

The system automatically enriches each node's input mapping with data from the previous node:

```typescript
const enrichedInputMapping = {
  ...node.inputMapping,
  previousResult: previousResult.output,
  previousId: previousResult.output?.id,
  previousStatus: previousResult.output?.status,
  previousData: previousResult.output?.data,
  previousFullResult: previousResult,
}
```

### Framework-Agnostic Design

This approach works with any workflow system:

- **Temporal**: Use with activities and workflows
- **AWS Step Functions**: Adapt for state machine steps
- **Azure Logic Apps**: Use with action steps
- **Custom Systems**: Implement in any workflow engine

### Error Handling

- If there's no previous result (first node), only the original input mapping is used
- Missing fields gracefully fall back to `undefined`
- The system continues execution even if some fields are missing

## Best Practices

### 1. Node Naming

Use descriptive names that indicate the node's purpose:

- ✅ `createUserAccount`
- ✅ `sendWelcomeEmail`
- ✅ `processPayment`
- ❌ `node1`, `action2`, `step3`

### 2. Data Structure

Design your nodes to return consistent data structures:

```typescript
// Good: Consistent structure
{
  output: {
    id: '123',
    email: 'user@example.com',
    status: 'active'
  }
}

// Good: Simple structure
{
  id: '123',
  email: 'user@example.com',
  status: 'active'
}

// Avoid: Inconsistent structures
{ output: 'success' } // Next node can't access fields
```

### 3. Field Access

Use the most specific field available:

```typescript
// Prefer specific fields
userId: '{{previousId}}' // Direct access
email: '{{previousResult.email}}' // Specific field

// Over generic access
userId: '{{previousFullResult.output.id}}' // Too verbose
```

### 4. Error Handling

Always provide fallbacks for critical data:

```typescript
{
  inputMapping: {
    email: '{{previousResult.email}} || "unknown@example.com"',
    name: '{{previousResult.name}} || "Unknown User"'
  }
}
```

## Testing Your Workflows

### 1. Test with Sample Data

Create test workflows with realistic data:

```typescript
const testWorkflow = {
  nodes: [
    {
      id: 'trigger',
      inputMapping: {
        email: 'test@example.com',
        name: 'Test User',
        amount: 99.99,
      },
    },
    // ... other nodes
  ],
}
```

### 2. Verify Data Flow

Check that data flows correctly between nodes:

- First node: Uses only input mapping
- Subsequent nodes: Can access previous result data
- Final result: Contains all expected data

### 3. Test Edge Cases

- Missing fields in previous results
- Null or undefined values
- Empty arrays or objects

## Limitations

This simple approach works best for:

✅ **Linear workflows** - A → B → C → D  
✅ **Simple branching** - A → B → [C OR D] → E  
✅ **Sequential processing** - Each node depends only on the previous one

It's not suitable for:

❌ **Complex dependencies** - Node C depends on both A and B  
❌ **Parallel execution** - Multiple nodes running simultaneously  
❌ **Conditional execution** - Skip nodes based on conditions  
❌ **Loops** - Repeat nodes based on data

For these cases, consider the advanced workflow system with dependency management.

## Adapting to Different Workflow Systems

### Temporal

```typescript
// Use with Temporal activities
const result = await proxyActivities.executeNode({ auth, node: enrichedNode })
```

### AWS Step Functions

```typescript
// Adapt for Step Functions state machine
const enrichedInput = {
  ...state.input,
  previousResult: state.previousResult,
  previousId: state.previousId,
}
```

### Azure Logic Apps

```typescript
// Use with Logic Apps actions
const enrichedInputs = {
  ...action.inputs,
  previousResult: workflowContext.previousResult,
}
```

### Custom Workflow Engine

```typescript
// Implement in any custom system
function executeNode(node, previousResult) {
  const enrichedInput = createEnrichedInputMapping(node.inputMapping, previousResult)
  return node.execute(enrichedInput)
}
```

## Migration from Basic System

If you're migrating from the basic sequential system:

1. **No changes needed** - Your existing workflows will work as-is
2. **Add data access** - Update input mappings to use `{{previousResult.field}}`
3. **Test thoroughly** - Verify data flows correctly between nodes
4. **Optimize gradually** - Start with simple cases and add complexity as needed

## Troubleshooting

### Common Issues

**Data not flowing between nodes:**

- Check that you're using `{{previousResult.field}}` syntax
- Verify the field exists in the previous node's output
- Ensure the previous node executed successfully

**Missing fields:**

- Use optional chaining: `{{previousResult?.field}}`
- Provide fallback values: `{{previousResult.field || "default"}}`
- Check the previous node's output structure

**Type errors:**

- Ensure field types match expected input types
- Use type conversion if needed: `{{String(previousResult.number)}}`
- Validate data before using in subsequent nodes
