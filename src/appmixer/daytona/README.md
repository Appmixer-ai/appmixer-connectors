# Daytona Connector

This connector provides integration with Daytona, a secure and elastic infrastructure for running AI-generated code in isolated sandbox environments.

## Overview

Daytona allows you to create, manage, and execute code in sandboxes with features like:
- Lightning-fast sandbox creation (sub-90ms)
- Multiple programming language support (Python, Node.js, Go, Java, Ruby, PHP, Rust)
- Secure isolated runtime environments
- File system management
- Code execution with output capture
- Resource monitoring and logging

## Authentication

The connector uses API Key authentication. To get your API key:
1. Visit https://app.daytona.io
2. Navigate to Dashboard → Keys
3. Generate a new API key

## Components

### Sandbox Management

#### CreateSandbox
Creates a new sandbox instance with specified configuration.

**Inputs:**
- `language` (required): Programming language (python, node, go, java, ruby, php, rust)
- `image` (optional): Custom Docker/OCI image
- `name` (optional): Sandbox name
- `env` (optional): Environment variables as JSON object

**Outputs:**
- Sandbox ID, name, language, image, status, created timestamp

#### ListSandboxes
Lists all sandboxes in your account.

**Inputs:**
- `outputType`: Output format (first, array, object)

**Outputs:**
- Array or stream of sandbox objects with ID, name, language, image, status, created timestamp

#### GetSandbox
Retrieves detailed information about a specific sandbox.

**Inputs:**
- `sandboxId` (required): Unique sandbox identifier

**Outputs:**
- Sandbox details including ID, name, language, image, status, created and updated timestamps

#### DeleteSandbox
Permanently deletes a sandbox.

**Inputs:**
- `sandboxId` (required): Unique sandbox identifier

**Outputs:**
- Empty object on success

#### StartSandbox
Starts a stopped sandbox.

**Inputs:**
- `sandboxId` (required): Unique sandbox identifier

**Outputs:**
- Sandbox ID and status

#### StopSandbox
Stops a running sandbox to free up resources.

**Inputs:**
- `sandboxId` (required): Unique sandbox identifier

**Outputs:**
- Sandbox ID and status

### Code Execution

#### ExecuteCode
Executes code in a sandbox and returns the result.

**Inputs:**
- `sandboxId` (required): Unique sandbox identifier
- `code` (required): Code to execute
- `timeout` (optional): Maximum execution time in seconds

**Outputs:**
- `result`: Execution result
- `exitCode`: Process exit code
- `stdout`: Standard output
- `stderr`: Standard error
- `executionTime`: Execution duration

### File Management

#### WriteFile
Writes content to a file in the sandbox filesystem.

**Inputs:**
- `sandboxId` (required): Unique sandbox identifier
- `path` (required): File path (e.g., /workspace/file.txt)
- `content` (required): File content

**Outputs:**
- File path and size

#### ReadFile
Reads the content of a file from the sandbox filesystem.

**Inputs:**
- `sandboxId` (required): Unique sandbox identifier
- `path` (required): File path

**Outputs:**
- File content, path, and size

#### ListFiles
Lists all files in a sandbox directory.

**Inputs:**
- `sandboxId` (required): Unique sandbox identifier
- `path` (optional): Directory path (default: /workspace)
- `outputType`: Output format (first, array, object)

**Outputs:**
- Array or stream of file objects with name, path, size, type, and modified timestamp

### Monitoring

#### GetSandboxLogs
Retrieves logs from a sandbox for debugging and monitoring.

**Inputs:**
- `sandboxId` (required): Unique sandbox identifier
- `tail` (optional): Number of recent log lines to retrieve

**Outputs:**
- Logs and timestamp

#### GetSandboxMetrics
Retrieves resource usage metrics for a sandbox.

**Inputs:**
- `sandboxId` (required): Unique sandbox identifier

**Outputs:**
- CPU usage, memory usage, disk usage, network in/out, and timestamp

## Example Workflow

1. **Create a Sandbox**: Use CreateSandbox to create a Python sandbox
2. **Write Code**: Use WriteFile to add Python scripts
3. **Execute Code**: Use ExecuteCode to run the code
4. **Get Results**: View stdout, stderr, and exit code
5. **Monitor**: Use GetSandboxLogs and GetSandboxMetrics to monitor execution
6. **Cleanup**: Use DeleteSandbox when done

## Rate Limiting

The connector implements rate limiting to prevent API abuse:
- Maximum 100 requests per minute per user
- Uses sliding window throttling with FIFO queuing

## Documentation

For more information about Daytona:
- Official Documentation: https://www.daytona.io/docs
- API Reference: https://www.daytona.io/docs/en/tools/api/
- Getting Started: https://www.daytona.io/docs/getting-started/

## Version

Current version: 1.0.0

## Support

For issues or questions about this connector, please refer to the Daytona documentation or contact Appmixer support.
