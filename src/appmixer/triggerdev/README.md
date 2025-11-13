# Trigger.dev Connector

This connector provides integration with [Trigger.dev](https://trigger.dev), an open-source background job framework with declarative workflows.

## Overview

Trigger.dev allows you to create long-running background tasks and workflows in your applications. This Appmixer connector enables you to interact with the Trigger.dev Management API to manage runs, tasks, projects, deployments, and environments.

## Authentication

The connector uses API Key authentication. To connect:

1. Log in to your Trigger.dev account
2. Navigate to your project settings
3. Go to the API Keys section
4. Copy your API key
5. In Appmixer, when configuring a Trigger.dev component:
   - Enter your API key
   - Enter your Trigger.dev instance URL (default: `https://cloud.trigger.dev`)

## Components

### 1. ListRuns
Lists all task runs with optional filters.

**Inputs:**
- `status` (optional): Filter by run status (COMPLETED, FAILED, EXECUTING, WAITING_FOR_DEPLOY, QUEUED, CANCELED)
- `taskIdentifier` (optional): Filter by task identifier
- `outputType`: Choose output format (array, object, first, file)

**Outputs:**
- Array of runs with details (id, status, taskIdentifier, createdAt, updatedAt, startedAt, completedAt)

### 2. GetRun
Retrieves details of a specific task run.

**Inputs:**
- `runId` (required): The unique identifier of the run

**Outputs:**
- Run details including status, output, and error information

### 3. CancelRun
Cancels a running task.

**Inputs:**
- `runId` (required): The unique identifier of the run to cancel

**Outputs:**
- Empty object on success

### 4. ReplayRun
Replays a failed run.

**Inputs:**
- `runId` (required): The unique identifier of the run to replay

**Outputs:**
- New run details (id, status, taskIdentifier, createdAt)

### 5. ListTasks
Lists all tasks in a project.

**Inputs:**
- `projectId` (optional): Filter tasks by project ID
- `outputType`: Choose output format (array, object, first, file)

**Outputs:**
- Array of tasks with details (id, slug, filePath, exportName, createdAt, updatedAt)

### 6. ListProjects
Lists all projects in your Trigger.dev account.

**Inputs:**
- `outputType`: Choose output format (array, object, first, file)

**Outputs:**
- Array of projects with details (id, name, slug, createdAt, updatedAt)

### 7. CreateBatchTrigger
Triggers a batch of tasks with multiple items.

**Inputs:**
- `taskIdentifier` (required): The identifier of the task to trigger
- `items` (required): JSON array of items to process. Each item will trigger the task with its data as payload.

**Outputs:**
- Batch details (id, status, createdAt)

**Example:**
```json
[
  {"userId": 1, "action": "process"},
  {"userId": 2, "action": "process"},
  {"userId": 3, "action": "process"}
]
```

### 8. ListDeployments
Lists all deployments.

**Inputs:**
- `environmentId` (optional): Filter by environment ID
- `outputType`: Choose output format (array, object, first, file)

**Outputs:**
- Array of deployments with details (id, version, status, environmentId, createdAt, updatedAt)

### 9. GetDeployment
Retrieves details of a specific deployment.

**Inputs:**
- `deploymentId` (required): The unique identifier of the deployment

**Outputs:**
- Deployment details (id, version, status, environmentId, createdAt, updatedAt)

### 10. ListEnvironments
Lists all environments.

**Inputs:**
- `outputType`: Choose output format (array, object, first, file)

**Outputs:**
- Array of environments with details (id, slug, type, createdAt, updatedAt)

## Output Types

Most list components support multiple output types:

- **All items at once (array)**: Returns all items in a single array
- **One item at a time (object)**: Sends each item separately, useful for processing items individually in a workflow
- **First item only (first)**: Returns only the first item
- **Store to CSV file (file)**: Saves the results to a CSV file and returns the file ID

## Rate Limiting

The connector implements rate limiting to prevent API abuse:
- Maximum 1000 calls per hour per user
- Maximum 10 calls per second per user

## Usage Examples

### Example 1: List all completed runs
1. Add the **ListRuns** component to your workflow
2. Set `status` to "COMPLETED"
3. Set `outputType` to "array"
4. Connect to the next component in your workflow

### Example 2: Trigger a batch of tasks
1. Add the **CreateBatchTrigger** component
2. Set `taskIdentifier` to your task's identifier (e.g., "process-user-data")
3. Set `items` to a JSON array of data:
   ```json
   [{"userId": 1}, {"userId": 2}, {"userId": 3}]
   ```
4. The component will create a batch trigger for processing

### Example 3: Monitor and replay failed runs
1. Use **ListRuns** with `status` set to "FAILED"
2. Connect to a **ReplayRun** component
3. Map the `runId` from ListRuns to ReplayRun
4. This will automatically replay all failed runs

## API Documentation

For more details about the Trigger.dev API, see:
- [Trigger.dev Management API Documentation](https://trigger.dev/docs/management/overview)
- [Trigger.dev Documentation](https://trigger.dev/docs)

## Version History

### 1.0.0
- Initial release with 10 core components:
  - ListRuns, GetRun, CancelRun, ReplayRun
  - ListTasks, ListProjects
  - CreateBatchTrigger
  - ListDeployments, GetDeployment
  - ListEnvironments

## Support

For issues or feature requests related to this connector, please contact Appmixer support or submit an issue in the repository.
