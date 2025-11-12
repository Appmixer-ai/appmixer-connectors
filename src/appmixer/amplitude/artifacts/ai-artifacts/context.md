# Amplitude Connector Context

## Service Overview
Amplitude is a product analytics platform that helps companies understand user behavior through event tracking and analysis. The platform provides comprehensive analytics tools for mobile and web applications, allowing businesses to track user journeys, analyze funnels, create cohorts, and measure user engagement.

## Authentication Method
**API Key Authentication** (Basic Authentication with API Key + Secret Key)

Amplitude uses API Key authentication with basic HTTP authentication for most of their APIs. The authentication requires:
- **API Key**: Project-specific API key
- **Secret Key**: Project-specific secret key for secure operations

### How to Obtain API Keys:
1. Log into your Amplitude account
2. Navigate to **Settings** → **Organization Settings** → **Projects**
3. Select your project
4. View the **API Key** and **Secret Key** in the General tab (only admins and managers can view these)

**Official Documentation**: https://amplitude.com/docs/apis/authentication

### Authentication Format:
- **Basic Authentication**: Uses base64-encoded credentials in format `{api-key}:{secret-key}`
- **Authorization Header**: `Authorization: Basic {base64-encoded-credentials}`
- **Alternative**: Some endpoints accept API key in request body as `api_key=API_KEY`

## Essential Components (Actions)

### 1. SendEvent
**Description**: Send custom events to Amplitude for tracking user behavior and application interactions.
**API Endpoint**: POST `/2/httpapi`
**Purpose**: Core functionality for tracking user actions, page views, feature usage, and custom business events.

### 2. UpdateUserProperties
**Description**: Update user properties without sending an event using the Identify API.
**API Endpoint**: POST `/identify`
**Purpose**: Manage user attributes, demographics, preferences, and custom properties for segmentation and analysis.

### 3. ListCohorts
**Description**: Retrieve all behavioral cohorts available in the project.
**API Endpoint**: GET `/api/3/cohorts`
**Purpose**: Access user segments for targeted analysis and marketing campaigns.

### 4. GetCohort
**Description**: Download a specific cohort by ID with user data.
**API Endpoint**: GET `/api/5/cohorts/request/{id}`
**Purpose**: Export cohort member data for external use, marketing automation, or data analysis.

### 5. CreateCohort
**Description**: Create a new cohort by uploading a list of user IDs or Amplitude IDs.
**API Endpoint**: POST `/api/3/cohorts/upload`
**Purpose**: Build custom user segments for targeted campaigns and analysis.

### 6. UpdateCohortMembership
**Description**: Add or remove users from an existing cohort incrementally.
**API Endpoint**: POST `/api/3/cohorts/membership`
**Purpose**: Maintain dynamic cohorts by adding/removing users based on changing criteria.

### 7. ExportEventData
**Description**: Export raw event data for a specified time range.
**API Endpoint**: GET `/api/2/export`
**Purpose**: Extract historical event data for custom analysis, data warehousing, or compliance.

### 8. GetUserProfile
**Description**: Retrieve comprehensive user profile data including properties and cohort memberships.
**API Endpoint**: GET (User Profile API)
**Purpose**: Access detailed user information for customer support, personalization, or data analysis.

### 9. BatchUploadEvents
**Description**: Send multiple events in a single batch request for efficient data ingestion.
**API Endpoint**: POST `/2/httpapi` (with events array)
**Purpose**: Bulk event processing for high-volume applications and data imports.

### 10. IdentifyUser
**Description**: Associate a user ID with a device ID or update user identification.
**API Endpoint**: POST `/identify`
**Purpose**: User identity management and cross-device tracking for comprehensive user journey analysis.

## Essential Components (Triggers)

### 1. NewEventReceived
**Description**: Trigger when new events are received for specific event types or user segments.
**Implementation**: Polling-based trigger that checks for new events using Export API
**Purpose**: Real-time notifications for critical user actions or business events.

### 2. CohortUpdated
**Description**: Trigger when a cohort's membership changes or cohort is updated.
**Implementation**: Monitor cohort last modified timestamps and size changes
**Purpose**: Respond to changes in user segments for automated marketing or analysis workflows.

### 3. UserPropertyChanged
**Description**: Trigger when specific user properties are updated for tracked users.
**Implementation**: Monitor user property changes through event data analysis
**Purpose**: React to user profile changes for personalization, notifications, or segmentation updates.

## API Documentation Links
- **Main API Overview**: https://developers.amplitude.com/docs/apis-overview
- **HTTP V2 API** (Events): https://developers.amplitude.com/docs/http-v2-api
- **Identify API** (User Properties): https://developers.amplitude.com/docs/identify-api
- **Behavioral Cohorts API**: https://developers.amplitude.com/docs/behavioral-cohorts-api
- **Export API**: https://developers.amplitude.com/docs/export-api
- **Authentication Guide**: https://developers.amplitude.com/docs/apis/authentication

## Rate Limiting Considerations
- **Standard Plans**: 100 batches/second, 1000 events/second
- **Growth/Enterprise Plans**: <1MB request size, <2000 events per request
- **User Property Updates**: Max 1800 updates per hour per user
- **Export API**: 4GB size limit per request
- **Cohort Downloads**: 500 requests per month (Growth/Enterprise)

## Important Notes
- Amplitude uses milliseconds since epoch for timestamps
- All string values have 1024 character limit
- Events require either `user_id` or `device_id`
- Minimum ID length is 5 characters
- EU customers use different endpoints (api.eu.amplitude.com)
- Event deduplication using `insert_id` is recommended
