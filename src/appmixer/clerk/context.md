# Clerk Connector for Appmixer

## Overview
Clerk connector provides integration with Clerk's Backend API for user authentication, organization management, and session handling.

## Authentication
- **Type**: API Key (Secret Key from Clerk Dashboard)
- **Header**: `Authorization: Bearer YOUR_SECRET_KEY`
- **Source**: [Clerk Dashboard](https://dashboard.clerk.dev/) → API Keys

## Components

### User Management
- **FindUsers** - Search users with filtering by email, username, phone, or user ID
- **GetUser** - Retrieve user by ID
- **CreateUser** - Create new user with email addresses
- **UpdateUser** - Update user properties and metadata
- **DeleteUser** - Permanently delete user
- **BanUser** / **UnbanUser** - Ban/unban user (revokes sessions)
- **LockUser** / **UnlockUser** - Lock/unlock user account
- **CreateEmail** / **DeleteEmail** - Manage user email addresses

### Organization Management
- **FindOrganizations** - Search with query filters and membership criteria
- **GetOrganization** - Retrieve organization by ID
- **CreateOrganization** - Create new organization
- **UpdateOrganization** - Update organization properties
- **DeleteOrganization** - Permanently delete organization
- **AddUsertoOrganization** - Add user with role
- **RemoveUserFromOrganization** - Remove user from organization

### Session Management
- **FindSessions** - Search sessions by user, client, or session ID
- **GetSession** - Retrieve session by ID
- **CreateSession** - Create session (testing environments only)
- **RevokeSession** - Invalidate session

## Find Components
All Find components support flexible output types:
- **array** - All results in single response
- **object** - Stream results one at a time
- **first** - Return first match only
- **file** - Save results to CSV file

## API Endpoints
Base URL: `https://api.clerk.com/v1/`
- Users: `/users`
- Organizations: `/organizations`
- Sessions: `/sessions`

## Rate Limiting
- Create users: 20 requests per 10 seconds
- General API: 100 requests per 10 seconds
- Managed automatically by connector quota system
