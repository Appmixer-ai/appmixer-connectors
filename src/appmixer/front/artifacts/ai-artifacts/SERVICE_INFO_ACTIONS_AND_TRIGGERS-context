# Front Connector - Context and Planning

## Service Overview
Front is a customer communication platform that helps teams manage all their conversations in one unified inbox. It provides email, chat, SMS, social media, and phone integrations for streamlined customer service and team collaboration.

## API Documentation
Official API Documentation: https://dev.frontapp.com/docs/core-api-overview
API Reference: https://dev.frontapp.com/reference

## Authentication Method
**Type**: API Key Authentication
**Method**: Bearer Token in Authorization header
**Documentation**: https://dev.frontapp.com/docs/authentication

### How to obtain API Key:
1. Log in to your Front account
2. Navigate to Settings > API tokens
3. Click "Create new token"
4. Enter a description and select appropriate scopes
5. Copy the generated token for use in the connector

**Authentication Format**: 
- Header: `Authorization: Bearer {api_token}`
- The API token is used as a Bearer token in the Authorization header

## API Characteristics

- **Base URL:** https://api2.frontapp.com/
- **Authentication:** Bearer token in Authorization header
- **Response Format:** JSON
- **Pagination:** Cursor-based pagination with limit parameter
- **Rate Limiting:** Overall rate limit plus burst limits for certain endpoints
- **Error Handling:** Standard HTTP status codes with detailed error messages

## Essential Components Implemented

### Contacts Management
1. **FindContacts** - Search contacts by name, email or query
2. **GetContact** - Retrieve specific contact details by ID
3. **CreateContact** - Create new contact with name, description, handles, etc.
4. **UpdateContact** - Update existing contact information
5. **DeleteContact** - Remove contact from Front

### Conversations Management
1. **FindConversations** - Search conversations with advanced queries
2. **GetConversation** - Retrieve specific conversation details
3. **UpdateConversation** - Update conversation (assign, tag, change status)

### Messages Management
1. **GetMessage** - Retrieve specific message details
2. **SendMessage** - Send message in conversation (email, reply, note)

## API Endpoints Reference

### Contacts
- `GET /contacts` - List contacts with search
- `GET /contacts/{id}` - Get contact details  
- `POST /contacts` - Create contact
- `PATCH /contacts/{id}` - Update contact
- `DELETE /contacts/{id}` - Delete contact

### Conversations
- `GET /conversations` - List conversations with search
- `GET /conversations/{id}` - Get conversation details
- `PATCH /conversations/{id}` - Update conversation

### Messages
- `GET /messages/{id}` - Get message details
- `POST /conversations/{id}/messages` - Send message

## Data Types & Schemas

### Contact Object
- `id` (string) - Unique contact identifier
- `name` (string) - Contact's full name
- `description` (string) - Additional notes
- `avatar_url` (string) - Avatar image URL
- `is_spammer` (boolean) - Spam flag
- `links` (array) - Associated links/URLs
- `handles` (array) - Communication handles (email, phone, etc.)
- `groups` (array) - Contact groups
- `custom_fields` (object) - Custom field data
- `created_at` (number) - Creation timestamp
- `updated_at` (number) - Last update timestamp

### Conversation Object
- `id` (string) - Conversation identifier
- `subject` (string) - Conversation subject
- `status` (string) - Current status (assigned, unassigned, archived, deleted)
- `assignee` (object) - Assigned teammate details
- `recipient` (object) - Primary recipient
- `tags` (array) - Applied tags
- `links` (array) - Associated links
- `created_at` (number) - Creation timestamp
- `is_private` (boolean) - Privacy flag
- `draft_mode` (string) - Draft mode setting

### Message Object
- `id` (string) - Message identifier
- `type` (string) - Message type (email, sms, etc.)
- `is_inbound` (boolean) - Direction flag
- `is_draft` (boolean) - Draft status
- `subject` (string) - Message subject
- `body` (string) - HTML message content
- `text` (string) - Plain text content
- `author` (object) - Message author details
- `recipients` (array) - Message recipients
- `attachments` (array) - File attachments
- `created_at` (number) - Creation timestamp

## Rate Limiting
Front implements multiple rate limiting tiers:
- Overall API rate limit: ~2000 requests per hour
- Burst limits: ~50 requests per minute for intensive operations
- Message sending: ~20 requests per minute
- Conversation creation: ~10 requests per minute

The connector includes quota management to respect these limits.

## Error Handling
- **404 Not Found**: Resource doesn't exist (handled with notFound output port)
- **401 Unauthorized**: Invalid or expired API token
- **403 Forbidden**: Insufficient permissions for the requested action
- **422 Unprocessable Entity**: Invalid request data or validation errors
- **429 Too Many Requests**: Rate limit exceeded

## Implementation Notes

### Authentication
- All requests require `Authorization: Bearer {token}` header
- Token validation is performed during auth setup via `/me` endpoint
- Profile info extraction uses the `email` field as account identifier

### Search Functionality
- Contacts and conversations support query-based search via `q` parameter
- Advanced query syntax available (e.g., "status:open", "tag:urgent")
- Results are paginated with configurable limits

### Output Types
Many components support multiple output types:
- `"array"`: All results in single response
- `"object"`: One result at a time for processing
- `"first"`: Only the first result
- `"file"`: Export results to CSV file

### Component Standards Compliance
- All required inputs are validated in component behavior
- Update/delete components return empty objects on success
- Consistent error handling with CancelError for missing required fields
- Proper quota management with scoped resources

## Workflow Use Cases

### Customer Support Automation
1. **New Contact Creation**: Automatically create contacts from lead forms
2. **Conversation Assignment**: Route conversations based on content or priority
3. **Auto-Response**: Send templated responses to common inquiries
4. **Tag Management**: Automatically tag conversations based on keywords

### CRM Integration
1. **Contact Sync**: Synchronize contacts between Front and external CRM
2. **Activity Tracking**: Log Front conversations in CRM systems  
3. **Lead Qualification**: Update lead status based on conversation activity
4. **Follow-up Automation**: Create tasks or reminders in external systems

### Analytics and Reporting
1. **Conversation Export**: Export conversation data for analysis
2. **Response Time Tracking**: Monitor team performance metrics
3. **Tag Analysis**: Analyze conversation topics and trends
4. **Customer Satisfaction**: Track resolution status and outcomes

## Future Enhancements

### Additional Components (Not Yet Implemented)
- **ListInboxes**, **GetInbox** - Inbox management
- **ListTeams**, **GetTeam**, **ListTeammates**, **GetTeammate** - Team management
- **NewConversation**, **NewMessage**, **ConversationUpdated** - Trigger components for real-time events

### Advanced Features
- **Webhooks Support** - Real-time event processing
- **File Attachments** - Handle message attachments
- **Custom Channel Integration** - Connect external messaging platforms
- **Bulk Operations** - Process multiple records efficiently

This connector provides a solid foundation for Front integration with core functionality for contacts, conversations, and messages management.
