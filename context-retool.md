# Retool Connector Context

## Service Overview
Retool is a low-code platform for building internal tools and applications. It allows developers to quickly create dashboards, admin panels, and internal tools by connecting to databases, APIs, and other data sources with a drag-and-drop interface.

## Authentication Method
Retool API uses **API Token authentication** via Bearer tokens.

### Authentication Details
- **Type**: API Token (Bearer Token)
- **Header**: `Authorization: Bearer <api_token>`
- **Documentation**: https://docs.retool.com/org-users/guides/retool-api/authentication

### How to Obtain API Token
1. Log into your Retool organization
2. Navigate to Settings > API tokens
3. Click "Create API token"
4. Provide a name and description for the token
5. Select appropriate permissions/scopes
6. Copy the generated token (it will only be shown once)

**Note**: API tokens inherit the permissions of the user who created them.

## Base URL Structure
- Production: `https://<organization_name>.retool.com/api/v1`
- On-premise: `https://<your_retool_domain>/api/v1`

## Planned Components

Based on Retool's API capabilities and common use cases, the following components should be implemented:

### Core App Management
1. **ListApps** - Retrieve all applications in the organization
   - Description: Fetch a list of all apps with their metadata
   - Endpoint: GET /apps
   - Use case: Display available apps for management or monitoring

2. **GetApp** - Get details of a specific application
   - Description: Retrieve detailed information about a specific app
   - Endpoint: GET /apps/{app_id}
   - Use case: Get app configuration, version info, and metadata

3. **CreateApp** - Create a new application
   - Description: Create a new Retool application
   - Endpoint: POST /apps
   - Use case: Programmatically create apps from templates or configurations

4. **UpdateApp** - Update an existing application
   - Description: Modify app properties like name, description, or configuration
   - Endpoint: PATCH /apps/{app_id}
   - Use case: Update app metadata or settings

5. **DeleteApp** - Delete an application
   - Description: Remove an application from the organization
   - Endpoint: DELETE /apps/{app_id}
   - Use case: Clean up unused or test applications

### User Management
6. **ListUsers** - Get all users in the organization
   - Description: Retrieve list of users with their roles and permissions
   - Endpoint: GET /users
   - Use case: User audit, access management

7. **InviteUser** - Invite a new user to the organization
   - Description: Send invitation to join the Retool organization
   - Endpoint: POST /users/invite
   - Use case: Onboard new team members

8. **UpdateUser** - Update user permissions or details
   - Description: Modify user roles, groups, or other properties
   - Endpoint: PATCH /users/{user_id}
   - Use case: Manage user access and permissions

9. **RemoveUser** - Remove user from organization
   - Description: Revoke user access to the organization
   - Endpoint: DELETE /users/{user_id}
   - Use case: Offboard team members

### Resource Management
10. **ListResources** - Get all connected resources
    - Description: Retrieve databases, APIs, and other connected resources
    - Endpoint: GET /resources
    - Use case: Resource inventory and management

11. **CreateResource** - Connect a new resource
    - Description: Add database, API, or other data source
    - Endpoint: POST /resources
    - Use case: Programmatically add new data connections

12. **UpdateResource** - Update resource configuration
    - Description: Modify resource settings or credentials
    - Endpoint: PATCH /resources/{resource_id}
    - Use case: Update connection strings or credentials

13. **DeleteResource** - Remove a resource connection
    - Description: Remove a connected resource
    - Endpoint: DELETE /resources/{resource_id}
    - Use case: Clean up unused connections

### Query Management
14. **ListQueries** - Get queries in an application
    - Description: Retrieve all queries within a specific app
    - Endpoint: GET /apps/{app_id}/queries
    - Use case: Query inventory and management

15. **RunQuery** - Execute a query
    - Description: Programmatically run a query and get results
    - Endpoint: POST /apps/{app_id}/queries/{query_id}/run
    - Use case: Trigger data operations or retrieve computed results

### Groups and Permissions
16. **ListGroups** - Get all user groups
    - Description: Retrieve organization groups and their members
    - Endpoint: GET /groups
    - Use case: Access control management

17. **CreateGroup** - Create a new user group
    - Description: Create group for organizing users and permissions
    - Endpoint: POST /groups
    - Use case: Organize users by teams or roles

18. **UpdateGroup** - Modify group settings
    - Description: Update group name, permissions, or members
    - Endpoint: PATCH /groups/{group_id}
    - Use case: Manage group access and membership

## Priority Implementation Order
1. **ListApps** (Essential for basic functionality)
2. **GetApp** (Core app management)
3. **ListUsers** (User management foundation)
4. **ListResources** (Resource visibility)
5. **CreateApp** (App creation capabilities)
6. **InviteUser** (User onboarding)
7. **RunQuery** (Query execution)
8. **UpdateApp** (App management)
9. **ListGroups** (Permission management)
10. **CreateResource** (Resource management)

## API Considerations
- Rate limiting: Check Retool's rate limiting policies
- Pagination: Many list endpoints likely support pagination
- Error handling: Document common error responses
- Required fields: Identify mandatory parameters for each endpoint
- Permissions: Some operations may require specific user permissions

## Additional Notes
- Retool API tokens inherit the permissions of the user who created them
- Some endpoints may require admin privileges
- Consider implementing webhook support for real-time updates if available
- Test with different organization configurations (on-premise vs cloud)
