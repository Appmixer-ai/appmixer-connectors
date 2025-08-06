# Zoom Connector - Context and Planning

## Service Overview

Zoom is a video conferencing and communication platform. The connector should focus on meeting management (create, update, delete meetings), user management, webinar functionality, and basic account information. Key use cases include scheduling meetings, managing participants, retrieving meeting recordings, and integrating with calendar systems.

## API Documentation

Official API Documentation: https://developers.zoom.us/docs/api/

## Authentication Method

Zoom supports multiple authentication methods:

### 1. OAuth 2.0 (Recommended for user-authorized apps)
- Standard OAuth 2.0 flow
- Users authorize the app to access their Zoom data
- Suitable for apps that will be published on Zoom Marketplace
- Requires client_id, client_secret, and OAuth flow

### 2. Server-to-Server OAuth (For internal apps)
- Uses Account ID, Client ID, and Client Secret
- No user interaction required
- Access token valid for 1 hour (3600 seconds)
- Suitable for internal integrations
- Scopes are defined during app creation in Zoom Marketplace

**Selected Authentication Method**: OAuth 2.0 for broader applicability and user authorization.

### Authentication Setup Instructions:
1. Go to Zoom App Marketplace (https://marketplace.zoom.us/)
2. Sign in with Zoom account
3. Click "Develop" → "Build App"
4. Choose "OAuth" app type
5. Fill in app details and get Client ID and Client Secret
6. Configure redirect URLs and scopes
7. Activate the app

## Essential Components to Implement

Based on Zoom API capabilities and common use cases, the following components should be implemented:

### Meeting Management
1. **CreateMeeting** - Create a new meeting
   - Input: topic, start_time, duration, password, agenda, settings
   - Output: meeting details including join_url, meeting_id, start_url

2. **ListMeetings** - List user's meetings
   - Input: user_id (optional), type (upcoming, live, previous)
   - Output: array of meetings with basic details

3. **GetMeeting** - Get meeting details
   - Input: meeting_id
   - Output: detailed meeting information

4. **UpdateMeeting** - Update existing meeting
   - Input: meeting_id, updates (topic, start_time, duration, etc.)
   - Output: updated meeting details

5. **DeleteMeeting** - Delete a meeting
   - Input: meeting_id
   - Output: success confirmation

### User Management
6. **GetUser** - Get user information
   - Input: user_id (optional, defaults to 'me')
   - Output: user profile information

7. **ListUsers** - List users in account (for admin accounts)
   - Input: page_size, page_number, status
   - Output: array of users with basic information

### Webinar Management
8. **CreateWebinar** - Create a new webinar
   - Input: topic, start_time, duration, agenda, settings
   - Output: webinar details including join_url, webinar_id

9. **ListWebinars** - List user's webinars
   - Input: user_id (optional), page_size, page_number
   - Output: array of webinars

### Recording Management
10. **ListRecordings** - Get meeting recordings
    - Input: user_id, from, to, page_size
    - Output: array of recording details

11. **GetRecording** - Get specific recording details
    - Input: meeting_id
    - Output: recording files and details

### Account/Settings
12. **GetAccountSettings** - Get account settings
    - Input: none
    - Output: account configuration and limits

## API Base URL
https://api.zoom.us/v2

## Common API Endpoints

### Meetings
- POST /users/{userId}/meetings - Create meeting
- GET /users/{userId}/meetings - List meetings
- GET /meetings/{meetingId} - Get meeting
- PATCH /meetings/{meetingId} - Update meeting
- DELETE /meetings/{meetingId} - Delete meeting

### Users
- GET /users/me - Get current user
- GET /users/{userId} - Get user
- GET /users - List users

### Webinars
- POST /users/{userId}/webinars - Create webinar
- GET /users/{userId}/webinars - List webinars
- GET /webinars/{webinarId} - Get webinar

### Recordings
- GET /users/{userId}/recordings - List recordings
- GET /meetings/{meetingId}/recordings - Get meeting recordings

## Rate Limiting
- Zoom API has rate limiting (specific limits vary by endpoint)
- Should implement proper quota management in quota.js
- Access tokens expire after 1 hour for Server-to-Server OAuth

## Required Scopes (for OAuth)
- meeting:read
- meeting:write
- user:read
- webinar:read
- webinar:write
- recording:read
- account:read

## Additional Notes
- JWT authentication is deprecated (June 2023)
- Server-to-Server OAuth is for internal apps only
- OAuth 2.0 is recommended for marketplace apps
- All API responses are in JSON format
- Proper error handling needed for rate limits and authentication failures
