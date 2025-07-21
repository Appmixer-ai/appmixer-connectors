# Vercel Connector for Appmixer

## Overview

The Vercel connector enables integration with Vercel's cloud platform for frontend frameworks and static sites. This connector provides components for managing projects, deployments, domains, and teams programmatically.

## Authentication

This connector uses **API Key authentication** with Vercel Bearer tokens.

### Setup Instructions:

1. Log into your Vercel account
2. Go to Account Settings → Tokens
3. Click "Create" to create a new token
4. Enter a descriptive name for your token
5. Choose the appropriate scope (Personal Account or Team)
6. Set an expiration date (recommended for security)
7. Copy the token value (it will only be shown once)
8. Use this token when configuring the connector in Appmixer

## Available Components

### Project Management
- **ListProjects** - Retrieve list of projects with filtering and pagination
- **GetProject** - Get detailed information about a specific project

### Deployment Operations  
- **ListDeployments** - Get deployments list with filtering by project, state, target environment
- **GetDeployment** - Get detailed information about a specific deployment

### Domain Management
- **ListDomains** - Retrieve list of domains from account or team

### Team Management
- **ListTeams** - Get list of teams the authenticated user belongs to

## Features

- **Team Support**: All components support team-scoped operations via teamId parameter
- **Pagination**: Proper handling of paginated responses from Vercel API
- **Error Handling**: Comprehensive error handling with meaningful error messages
- **Rate Limiting**: Built-in quota management to respect Vercel API limits
- **Filtering**: Support for various filtering options on list operations

## Usage Examples

### Basic Project Listing
Use the ListProjects component to get all your projects:
- Connect the component to your workflow
- Optionally set a search term to filter projects
- Set limit to control number of results (default: 20, max: 100)
- For team projects, provide the teamId

### Deployment Monitoring
Use ListDeployments to monitor deployment status:
- Filter by projectId to get deployments for a specific project
- Filter by state (BUILDING, READY, ERROR, CANCELED) to track deployment status
- Filter by target (production, preview) to focus on specific environments
- Use since/until timestamps for date range filtering

### Domain Management
Use ListDomains to manage your domains:
- Get all domains associated with your account or team
- Use pagination to handle large domain lists
- Check verification status of domains

## Rate Limits

The connector implements the following rate limits:
- **General API calls**: 100 per hour, with burst protection of 5 per second
- **Deployment operations**: 20 per 5 minutes
- **Domain operations**: 50 per hour

## Error Handling

The connector provides detailed error messages for common scenarios:
- **401 Unauthorized**: Invalid API token or insufficient permissions
- **403 Forbidden**: Access denied to requested resource
- **404 Not Found**: Resource not found
- **429 Rate Limit**: Too many requests, try again later

## Future Enhancements
Additional components planned for future releases:
- CreateDeployment
- AddDomain, UpdateDomain, DeleteDomain, VerifyDomain
- Environment variable management
- Webhook management
- Deployment logs and events
## Validation Results

The following components have been successfully validated and are working correctly:

### Project Management Components

```bash
# List all projects
appmixer test component src/appmixer/vercel/core/FindProjects -i '{"in":{}}'
```

```bash
# Create a new project
appmixer test component src/appmixer/vercel/core/CreateProject -i '{"in":{"name":"test-project-validation","framework":"nextjs"}}'
```

```bash
# Get project details
appmixer test component src/appmixer/vercel/core/GetProject -i '{"in":{"id":"prj_VM3Y9F2bO1ZbS8BW2i9hfcRlU8CH"}}'
```

```bash
# Update project
appmixer test component src/appmixer/vercel/core/UpdateProject -i '{"in":{"id":"prj_VM3Y9F2bO1ZbS8BW2i9hfcRlU8CH","name":"test-project-validation-updated"}}'
```

```bash
# Delete project
appmixer test component src/appmixer/vercel/core/DeleteProject -i '{"in":{"id":"prj_VM3Y9F2bO1ZbS8BW2i9hfcRlU8CH"}}'
```

### Deployment Management Components

```bash
# List all deployments
appmixer test component src/appmixer/vercel/core/FindDeployments -i '{"in":{}}'
```

```bash
# Get deployment details
appmixer test component src/appmixer/vercel/core/GetDeployment -i '{"in":{"id":"dpl_9sHxqcTZJMnv3hLDaHqGQ4jbV6Bp"}}'
```

```bash
# Cancel deployment (requires a deployment in BUILDING state)
appmixer test component src/appmixer/vercel/core/CancelDeployment -i '{"in":{"id":"dpl_deploymentId"}}'
```

```bash
# Delete deployment
appmixer test component src/appmixer/vercel/core/DeleteDeployment -i '{"in":{"id":"dpl_deploymentId"}}'
```

### Test Environment Variable

All tests require the `VERCEL_API_TOKEN` environment variable to be set with a valid Vercel API token.

## API Documentation

For detailed information about Vercel's API, visit: https://vercel.com/docs/rest-api
