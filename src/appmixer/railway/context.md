# Railway Connector Development Context

## Service Overview

Railway is a cloud platform that provides infrastructure for developers to build, deploy, and scale applications. It offers a modern approach to application deployment with features like:

- **Project Management**: Create and manage projects containing multiple services
- **Service Deployment**: Deploy applications from GitHub repositories or Docker images
- **Environment Variables**: Manage configuration and secrets
- **Environment Management**: Support for multiple environments (production, staging, etc.)
- **Database Services**: Provision and manage databases
- **Custom Domains**: Configure custom domains for applications
- **Build and Deploy Pipeline**: Automatic builds and deployments from Git

## API Information

### API Type and Endpoint
- **API Type**: GraphQL
- **Endpoint**: `https://backboard.railway.com/graphql/v2`
- **Documentation**: https://docs.railway.com/guides/public-api
- **GraphiQL Playground**: https://railway.com/graphiql

### Authentication Method
Railway API uses **Bearer Token Authentication** with three types of tokens:

1. **Account Token** (Personal Token)
   - Access to all personal resources and teams the user belongs to
   - Should not be shared with others
   - Created at: https://railway.com/account/tokens

2. **Team Token**
   - Access only to team resources
   - Cannot access personal resources
   - Safe to share with team members
   - Created at: https://railway.com/account/tokens

3. **Project Token**
   - Scoped to a specific environment within a project
   - Limited access to that specific environment only
   - Created in project settings

**Authentication Headers**:
- Account/Team tokens: `Authorization: Bearer <token>`
- Team tokens (alternative): `Team-Access-Token: <token>`
- Project tokens: `Project-Access-Token: <token>`

**How to obtain tokens**:
1. Log into Railway dashboard
2. Navigate to Account Settings → Tokens page: https://railway.com/account/tokens
3. Click "New Token" button
4. Select team (for team token) or leave blank (for account token)
5. Provide a descriptive name for the token
6. Copy the generated token (shown only once)

### Rate Limits
- **Hourly Limit**: 1000 requests per hour
- **Rate Limit (RPS)**: 
  - Hobby users: 10 RPS
  - Pro users: 50 RPS
  - Enterprise: Custom limits

**Rate limit headers**:
- `X-RateLimit-Limit`: Maximum requests allowed per day
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: When the current window resets
- `Retry-After`: Time to wait before next request (when rate limited)

## Component Planning

Based on the Railway API capabilities and common use cases, the following components should be implemented:

### Core Project Management
1. **ListProjects**
   - Description: Retrieve all projects accessible to the authenticated user
   - GraphQL Query: Uses `me { projects { edges { node { ... } } } }`
   - Output: Array of projects with basic information (id, name, services, environments)

2. **CreateProject**
   - Description: Create a new project
   - GraphQL Mutation: `projectCreate`
   - Input: Project name, description (optional), team ID (optional)
   - Output: Created project details

3. **DeleteProject**
   - Description: Delete an existing project (destructive action)
   - GraphQL Mutation: `projectDelete(id: "project-id")`
   - Input: Project ID
   - Output: Success confirmation

### Service Management
4. **CreateService**
   - Description: Create a new service within a project with GitHub repo or Docker image
   - GraphQL Mutation: `serviceCreate`
   - Input: Project ID, source (GitHub repo or Docker image), name (optional)
   - Output: Created service details

5. **ListServices**
   - Description: List all services within a project
   - GraphQL Query: Part of project query
   - Input: Project ID
   - Output: Array of services with details

6. **UpdateService**
   - Description: Update service configuration
   - GraphQL Mutation: `serviceUpdate`
   - Input: Service ID, updated configuration
   - Output: Updated service details

7. **DeleteService**
   - Description: Delete a service from a project
   - GraphQL Mutation: `serviceDelete`
   - Input: Service ID
   - Output: Success confirmation

### Deployment Management
8. **DeployService**
   - Description: Trigger a new deployment for a service
   - GraphQL Mutation: Trigger deployment
   - Input: Service ID, environment ID
   - Output: Deployment details

9. **ListDeployments**
   - Description: Get deployment history for a service
   - GraphQL Query: `deployments`
   - Input: Project ID, Service ID, Environment ID
   - Output: Array of deployments with status and details

10. **RestartDeployment**
    - Description: Restart an existing deployment
    - GraphQL Mutation: `deploymentRestart(id: "deployment-id")`
    - Input: Deployment ID
    - Output: Success confirmation

11. **GetDeploymentLogs**
    - Description: Retrieve logs for a specific deployment
    - GraphQL Query: Deployment logs query
    - Input: Deployment ID
    - Output: Log entries

### Environment Variables Management
12. **ListVariables**
    - Description: Get all environment variables for a service or shared environment variables
    - GraphQL Query: `variables`
    - Input: Project ID, Environment ID, Service ID (optional for shared variables)
    - Output: Key-value pairs of variables

13. **SetVariable**
    - Description: Create or update an environment variable
    - GraphQL Mutation: `variableUpsert`
    - Input: Project ID, Environment ID, Service ID (optional), variable name, variable value
    - Output: Success confirmation

14. **DeleteVariable**
    - Description: Remove an environment variable
    - GraphQL Mutation: `variableDelete`
    - Input: Project ID, Environment ID, Service ID (optional), variable name
    - Output: Success confirmation

### Environment Management
15. **ListEnvironments**
    - Description: Get all environments within a project
    - GraphQL Query: Part of project query
    - Input: Project ID
    - Output: Array of environments

16. **CreateEnvironment**
    - Description: Create a new environment in a project
    - GraphQL Mutation: `environmentCreate`
    - Input: Project ID, environment name
    - Output: Created environment details

### Monitoring and Status
17. **GetServiceStatus**
    - Description: Get current status and health of a service
    - GraphQL Query: Service status query
    - Input: Service ID
    - Output: Service status, health metrics, resource usage

18. **GetProjectUsage**
    - Description: Get usage metrics for a project
    - GraphQL Query: Project usage query
    - Input: Project ID, time range (optional)
    - Output: Usage statistics, billing information

## GraphQL Schema Insights

### Key Data Types
- **Project**: Contains services, environments, and configurations
- **Service**: Represents a deployed application or database
- **Environment**: Deployment environment (production, staging, etc.)
- **Deployment**: Individual deployment instance
- **Variable**: Environment variable configuration

### Common Input Patterns
- Most mutations require `projectId`
- Service operations require `serviceId`
- Environment-specific operations require `environmentId`
- Variables can be service-specific or shared at environment level

### Error Handling
- GraphQL errors for invalid queries/mutations
- Authentication errors for invalid tokens
- Rate limiting errors when limits exceeded
- Validation errors for invalid input data

## Implementation Notes

### Authentication Implementation
Use Bearer token authentication with the format:
```javascript
headers: {
    'Authorization': `Bearer ${context.auth.accessToken}`,
    'Content-Type': 'application/json'
}
```

### GraphQL Request Structure
All requests should be POST to `https://backboard.railway.com/graphql/v2` with:
```javascript
{
    query: "graphql query/mutation string",
    variables: { /* query variables */ }
}
```

### Error Handling Strategy
- Check for GraphQL errors in response
- Handle rate limiting with appropriate retry logic
- Validate required inputs before making API calls
- Provide clear error messages for authentication failures

### Component Prioritization
**High Priority (Essential)**:
1. ListProjects
2. CreateService
3. DeployService
4. ListDeployments
5. SetVariable
6. ListVariables

**Medium Priority (Important)**:
7. CreateProject
8. ListServices
9. RestartDeployment
10. DeleteService

**Lower Priority (Nice-to-have)**:
11. DeleteProject
12. GetDeploymentLogs
13. GetServiceStatus
14. Environment management components

## API Reference Links
- **Main API Guide**: https://docs.railway.com/guides/public-api
- **Manage Projects**: https://docs.railway.com/guides/manage-projects
- **Manage Services**: https://docs.railway.com/guides/manage-services
- **Manage Deployments**: https://docs.railway.com/guides/manage-deployments
- **Manage Variables**: https://docs.railway.com/guides/manage-variables
- **API Reference**: https://docs.railway.com/reference/public-api
- **GraphiQL Playground**: https://railway.com/graphiql
- **Token Management**: https://railway.com/account/tokens

## Additional Resources
- **Discord Support**: https://discord.gg/railway
- **API Collection File**: https://gql-collection-server.up.railway.app/railway_graphql_collection.json
- **Company Website**: https://railway.com