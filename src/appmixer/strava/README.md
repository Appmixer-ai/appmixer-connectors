# Strava Connector for Appmixer

The Strava connector provides seamless integration with the Strava API v3, enabling users to manage activities, retrieve athlete data, and work with activity streams within Appmixer workflows.

## Overview

This connector includes 8 core components that cover the essential Strava API functionality for fitness tracking and activity management. All components are built with robust error handling, proper authentication, and comprehensive schema validation.

## Features

- **Activity Management**: Create, update, and retrieve activities
- **Athlete Data**: Access logged-in athlete information and statistics  
- **Activity Streams**: Retrieve detailed activity data streams
- **Search & Filter**: Find activities with flexible filtering options
- **OAuth 2.0 Authentication**: Secure integration with Strava accounts

## Authentication

This connector uses OAuth 2.0 authentication with the following scopes:
- `read` - Read basic activity data
- `activity:read_all` - Read detailed activity data
- `profile:read_all` - Read athlete profile information
- `activity:write` - Create and modify activities

## Components

### Profile & Athlete Data

#### GetLoggedInAthlete
Retrieves the authenticated athlete's profile information including name, location, and profile details.

**Test:**
```bash
npm test test/strava/GetLoggedInAthlete.test.js
```

#### GetAthleteStats
Retrieves comprehensive statistics for a specific athlete including activity counts, distance totals, and elevation gains.

**Test:**
```bash
npm test test/strava/GetAthleteStats.test.js
```

### Activity Management

#### CreateManualActivity
Creates a new manual activity in Strava with specified details like name, type, start time, and duration.

**Test:**
```bash
npm test test/strava/CreateManualActivity.test.js
```

#### GetActivity
Retrieves detailed information about a specific activity by its ID.

**Test:**
```bash
npm test test/strava/GetActivity.test.js
```

#### UpdateActivity
Updates an existing activity's properties such as name, description, type, or gear.

**Test:**
```bash
npm test test/strava/UpdateActivity.test.js
```

### Activity Discovery

#### ListActivities
Retrieves a list of activities for the authenticated athlete with optional pagination and filtering.

**Test:**
```bash
npm test test/strava/ListActivities.test.js
```

#### FindActivities
Searches for activities with advanced filtering options including date ranges, activity types, and keywords.

**Test:**
```bash
npm test test/strava/FindActivities.test.js
```

### Activity Streams

#### FindActivityStreams
Retrieves detailed stream data for an activity including GPS coordinates, elevation, heart rate, and power data.

**Test:**
```bash
npm test test/strava/FindActivityStreams.test.js
```
## Testing

Run all connector tests:
```bash
npm test test/strava/
```

Run individual component tests:
```bash
npm test test/strava/GetLoggedInAthlete.test.js
```

## Development Guidelines

## Error Handling

All components implement proper error handling:
- **Missing required fields:** Clear validation messages
- **Invalid authentication:** HTTP 401 errors with details
- **Resource not found:** HTTP 404 errors
- **Permission denied:** HTTP 403 errors for restricted operations

## Rate Limiting

The connector includes quota management to respect Strava's API rate limits.