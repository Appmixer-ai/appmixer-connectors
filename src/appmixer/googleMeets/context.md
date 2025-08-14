# Google Meet Connector

## Overview
Google Meet is a video conferencing service developed by Google. This connector provides functionality for creating and managing meeting spaces, accessing conference records, managing participants, and retrieving meeting artifacts (recordings and transcripts).

## API Documentation
- **Base URL**: `https://meet.googleapis.com`
- **API Version**: v2
- **Documentation**: https://developers.google.com/meet/api
- **Reference**: https://developers.google.com/workspace/meet/api/reference/rest/v2

## Authentication
The Google Meet API uses OAuth 2.0 authentication with user credentials. The connector will need to support the following authentication flow:

- **Type**: OAuth 2.0
- **Authorization URL**: `https://accounts.google.com/o/oauth2/auth`
- **Token URL**: `https://oauth2.googleapis.com/token`
- **Scopes Required**:
  - `https://www.googleapis.com/auth/meetings.space.created` - Create and manage meeting spaces
  - `https://www.googleapis.com/auth/meetings.space.readonly` - Read metadata about meeting spaces
  - `https://www.googleapis.com/auth/meetings.space.settings` - Edit and see settings for Google Meet calls
  - `https://www.googleapis.com/auth/drive.readonly` - Access recordings and transcripts (optional)

### How to obtain credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Meet API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. Configure authorized redirect URIs
6. Note the Client ID and Client Secret for the connector

## Core Components to Implement

### 1. Space Management
- **CreateSpace** - Creates a new meeting space
- **GetSpace** - Retrieves details about a meeting space
- **UpdateSpace** - Updates meeting space settings
- **EndActiveConference** - Ends an active conference in a space

### 2. Conference Records
- **ListConferences** - Lists conference records
- **GetConference** - Gets a specific conference record by ID

### 3. Participant Management
- **ListParticipants** - Lists participants in a conference
- **GetParticipant** - Gets details about a specific participant
- **ListParticipantSessions** - Lists sessions for a participant
- **GetParticipantSession** - Gets details about a participant session

### 4. Meeting Artifacts
- **ListRecordings** - Lists recordings from a conference
- **GetRecording** - Gets a specific recording
- **ListTranscripts** - Lists transcripts from a conference
- **GetTranscript** - Gets a specific transcript
- **ListTranscriptEntries** - Lists transcript entries
- **GetTranscriptEntry** - Gets a specific transcript entry

## API Endpoints

### Spaces
- `POST /v2/spaces` - Create a space
- `GET /v2/spaces/{name}` - Get space details
- `PATCH /v2/spaces/{name}` - Update space
- `POST /v2/spaces/{name}:endActiveConference` - End active conference

### Conference Records
- `GET /v2/conferenceRecords` - List conferences
- `GET /v2/conferenceRecords/{name}` - Get conference

### Participants
- `GET /v2/conferenceRecords/{parent}/participants` - List participants
- `GET /v2/conferenceRecords/{parent}/participants/{name}` - Get participant
- `GET /v2/conferenceRecords/{parent}/participants/{parent}/participantSessions` - List sessions
- `GET /v2/conferenceRecords/{parent}/participants/{parent}/participantSessions/{name}` - Get session

### Recordings
- `GET /v2/conferenceRecords/{parent}/recordings` - List recordings
- `GET /v2/conferenceRecords/{parent}/recordings/{name}` - Get recording

### Transcripts
- `GET /v2/conferenceRecords/{parent}/transcripts` - List transcripts
- `GET /v2/conferenceRecords/{parent}/transcripts/{name}` - Get transcript
- `GET /v2/conferenceRecords/{parent}/transcripts/{parent}/entries` - List entries
- `GET /v2/conferenceRecords/{parent}/transcripts/{parent}/entries/{name}` - Get entry

## Key Features
- Create instant meeting spaces for video conferencing
- Manage meeting configurations and settings
- Track conference participants and their sessions
- Access meeting recordings and transcripts post-conference
- Integration with Google Calendar for scheduling
- Real-time meeting management capabilities

## Use Cases
1. **Sales and Account Management**: Retrieve meeting data for records, fetch artifacts for analysis
2. **Learning and Development**: Create training meetings, assign co-host roles, access recordings
3. **Developer Operations**: Create instant meetings for teams, share real-time meeting info
4. **Compliance and Recording**: Access transcripts and recordings for compliance purposes

## Rate Limits
Standard Google API rate limits apply. The connector should implement appropriate throttling and retry logic.

## Important Notes
- The Meet REST API is not intended for performance tracking or user evaluation
- Meeting codes expire after 365 days of inactivity
- Only one active conference can be held in a space at any time
- Some features require domain-wide delegation for enterprise use cases
