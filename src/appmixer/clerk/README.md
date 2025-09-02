# Clerk Connector

Clerk connector for Appmixer enables integration with Clerk's Backend API to manage users, organizations, and sessions.

## Authentication

Requires a Clerk Secret Key from your [Clerk Dashboard](https://dashboard.clerk.dev/) API Keys section.

## Components

### User Management
- **FindUsers** - Search users by email, username, phone number, or user ID
- **GetUser** - Get user details by ID
- **CreateUser** - Create new user
- **UpdateUser** - Update user properties
- **DeleteUser** - Delete user
- **BanUser** / **UnbanUser** - Ban/unban user
- **LockUser** / **UnlockUser** - Lock/unlock user account
- **CreateEmail** / **DeleteEmail** - Manage user email addresses

### Organization Management
- **FindOrganizations** - Search organizations by query, user membership, or members count
- **GetOrganization** - Get organization details by ID
- **CreateOrganization** - Create new organization
- **UpdateOrganization** - Update organization properties
- **DeleteOrganization** - Delete organization
- **AddUsertoOrganization** / **RemoveUserFromOrganization** - Manage organization membership

### Session Management
- **FindSessions** - Search sessions by user ID, client ID, or session ID
- **GetSession** - Get session details by ID
- **CreateSession** - Create session (testing only)
- **RevokeSession** - Revoke session

## Find Components Features

All Find components support multiple output formats:
- **array** (default) - All items at once
- **object** - Items one at a time
- **first** - First matching item only
- **file** - Save to CSV file

Find components return all matching results without pagination limits.

## Rate Limits

- Create users: 20 requests per 10 seconds
- Other endpoints: 100 requests per 10 seconds

Rate limits are handled automatically by the connector's quota management.
