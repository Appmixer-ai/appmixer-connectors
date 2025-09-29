# HelpScout Connector Context

## Service Overview

HelpScout is a customer service platform that provides email support, live chat, and knowledge base solutions. The platform helps teams manage customer conversations, track customer information, organize support inboxes, and provide efficient customer service through various channels.

## API Documentation

**Primary API Documentation**: https://developer.helpscout.com/
**Inbox API 2.0**: https://developer.helpscout.com/mailbox-api/
**Webhooks**: https://developer.helpscout.com/webhooks/

## Authentication

**Recommended Method**: OAuth 2.0 (most secure)

HelpScout supports OAuth 2.0 with two flows:
1. **Authorization Code Flow** - For public integrations used by multiple HelpScout users
2. **Client Credentials Flow** - For internal integrations

### OAuth 2.0 Setup

1. Create OAuth2 application in HelpScout: Profile > My apps > Create My App
2. Obtain client_id and client_secret
3. For Authorization Code flow, provide redirect URL
4. For Client Credentials flow, can use placeholder URL (e.g., https://www.google.com)

**Base URL**: `https://api.helpscout.net/v2`
**Token Endpoint**: `https://api.helpscout.net/v2/oauth2/token`
**Authorization Endpoint**: `https://secure.helpscout.net/authentication/authorizeClientApplication`

**Token Lifetime**: 2 days (172800 seconds)
**Refresh Token**: Available for Authorization Code flow

### Authentication Documentation
- **OAuth2 Setup**: https://developer.helpscout.com/mailbox-api/overview/authentication/
- **API Rate Limiting**: https://developer.helpscout.com/mailbox-api/overview/rate-limiting/

## Essential Components (Actions - Max 10)

### Conversation Management
1. **FindConversations** - Search and list conversations with filters
   - Filter by mailbox, status, tags, assignee, date ranges
   - Support for advanced query syntax
   - Pagination support

2. **GetConversation** - Get specific conversation by ID
   - Include conversation threads and metadata
   - Custom fields, tags, and assignee information

3. **CreateConversation** - Create new conversation
   - Support for email conversations
   - Set initial customer, subject, thread content

4. **UpdateConversation** - Update conversation properties
   - Change status, assignee, tags, custom fields
   - Conversation state management

### Customer Management
5. **FindCustomers** - Search and list customers
   - Filter by name, email, mailbox, modification date
   - Advanced search capabilities

6. **GetCustomer** - Get specific customer by ID
   - Complete customer profile with contact information
   - Associated organizations and properties

7. **CreateCustomer** - Create new customer
   - Contact information, organization association
   - Background notes and properties

8. **UpdateCustomer** - Update customer information
   - Contact details, properties, organization

### Mailbox Management
9. **ListMailboxes** - Get all accessible mailboxes
   - Inbox information and metadata
   - Folder structure access

### Thread Management
10. **CreateThread** - Add reply or note to conversation
    - Customer replies, agent replies, internal notes
    - Support for attachments and formatting

## Essential Triggers (Max 3)

### Conversation Triggers
1. **NewConversation** - Triggers when new conversation is created
   - Webhook event: `convo.created`
   - Real-time notifications for new customer inquiries

2. **ConversationStatusChanged** - Triggers when conversation status changes
   - Webhook event: `convo.status`
   - Monitor conversation lifecycle (open, pending, closed, spam)

### Customer Triggers  
3. **NewCustomer** - Triggers when new customer is created
   - Webhook event: `customer.created`
   - Track new customer registrations

## Available Webhook Events

**Conversation Events**:
- `convo.assigned` - Conversation assigned
- `convo.created` - New conversation created
- `convo.deleted` - Conversation deleted
- `convo.merged` - Conversation merged
- `convo.moved` - Conversation moved
- `convo.status` - Status updated
- `convo.tags` - Tags updated
- `convo.custom-fields` - Custom fields updated
- `convo.customer.reply.created` - Customer reply
- `convo.agent.reply.created` - Agent reply
- `convo.note.created` - Note created

**Customer Events**:
- `customer.created` - Customer created
- `customer.updated` - Customer updated
- `customer.deleted` - Customer deleted

**Other Events**:
- `satisfaction.ratings` - Rating received
- `tag.created` - Tag created
- `tag.updated` - Tag updated
- `tag.deleted` - Tag deleted

## Key API Features

### Pagination
- Uses HAL (Hypertext Application Language) format
- Standard pagination with page numbers
- Embedded resources and navigation links

### Rate Limiting
- API rate limits apply (check current limits in documentation)
- HTTP 429 status code for rate limit exceeded

### Error Handling
- Standard HTTP status codes
- JSON error responses with detailed messages
- Specific error codes for different scenarios

### Data Format
- JSON request/response format
- HAL+JSON for responses with embedded resources
- ISO 8601 date format

### Custom Fields
- Support for custom fields on conversations
- Field type validation and searching
- Dropdown options with IDs

## Implementation Notes

1. **OAuth2 Flow**: Implement Authorization Code flow for public use, Client Credentials for internal use
2. **Webhook Verification**: Use HMAC-SHA1 signature verification for webhook security
3. **Error Handling**: Handle authentication errors, rate limits, and API failures gracefully
4. **Pagination**: Implement proper pagination for list operations
5. **Search**: Support HelpScout's advanced query syntax for flexible searching
6. **Custom Fields**: Handle custom field types and validation properly
7. **File Attachments**: Support file operations for conversation threads
8. **State Management**: Track conversation states and customer information changes

## API Quotas & Limits
- Monitor API usage to avoid rate limits
- Implement retry logic for transient failures
- Use appropriate polling intervals for trigger components
- Batch operations where possible to optimize API usage

## Security Considerations
- Store OAuth tokens securely
- Implement proper webhook signature verification
- Use HTTPS for all API communication  
- Handle sensitive customer data appropriately
- Implement proper scope limitations for OAuth applications