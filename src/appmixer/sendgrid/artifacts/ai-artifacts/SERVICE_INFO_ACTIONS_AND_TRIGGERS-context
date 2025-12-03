# SendGrid Connector - Development Context

## Service Overview

**Service Name:** SendGrid (Twilio SendGrid)  
**Service URL:** https://www.sendgrid.com  
**API Base URL:** https://api.sendgrid.com (Global), https://api.eu.sendgrid.com (EU)  
**API Reference:** https://www.twilio.com/docs/sendgrid/api-reference

SendGrid is a cloud-based email delivery service that provides a powerful and reliable platform for sending transactional and marketing emails at scale. It offers REST APIs for sending emails, managing contacts, creating email templates, and tracking email performance.

---

## Authentication

### Authentication Type: API Key

**Security Method:** Bearer Token Authentication (Recommended)  
**Alternative:** Basic Authentication (Legacy - not recommended)

### How to Obtain API Key

1. Log in to your SendGrid account at https://app.sendgrid.com/
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Choose the desired permissions level
5. Copy the generated API key immediately (it will only be displayed once)

### Authentication Implementation Details

**Header Format:**
```
Authorization: Bearer <YOUR_API_KEY_HERE>
```

**Example:**
```bash
curl -X GET "https://api.sendgrid.com/v3/templates" \
  -H "Authorization: Bearer SG.your_api_key_here" \
  -H "Content-Type: application/json"
```

**Security Notes:**
- API keys should be stored securely and never hardcoded
- API key permissions can be configured to limit access to specific functions
- Rotate API keys regularly for security
- DeletedAPI keys cannot be recovered; you must create a new one if compromised

### Profile Information Retrieval

For account validation, use the `/v3/user/profile` endpoint to fetch user profile information:

```
GET https://api.sendgrid.com/v3/user/profile
Authorization: Bearer <API_KEY>
```

Expected response includes user account details that can be used for verification.

---

## Essential Components (Actions)

### 1. SendEmail
**Endpoint:** `POST /v3/mail/send`

Send transactional emails with flexible configuration options.

**Key Features:**
- Support for multiple recipients (To, CC, BCC)
- Plain text and HTML content
- Email attachments (Base64 encoded)
- Personalization for bulk email sending
- Template support (both standard and dynamic templates)
- Custom headers and tracking parameters
- Scheduled sending (up to 72 hours in advance)
- Batch processing capabilities

**Required Fields:**
- `to` (array) - Email recipient(s)
- `from` (object) - Sender email and name
- `subject` (string) - Email subject line
- `content` (array) - Message body (at least one MIME type required)

**Optional Fields:**
- `cc` (array) - Carbon copy recipients
- `bcc` (array) - Blind carbon copy recipients
- `replyTo` (object) - Reply-to email address
- `attachments` (array) - File attachments (Base64 encoded)
- `template_id` (string) - Email template ID
- `dynamic_template_data` (object) - Data for dynamic templates
- `send_at` (integer) - Unix timestamp for scheduled sending
- `categories` (array) - Message categories for tracking
- `custom_args` (object) - Custom tracking arguments

---

### 2. CreateContact
**Endpoint:** `PUT /v3/marketing/contacts`

Add or update a contact in the SendGrid Marketing Campaigns system.

**Key Features:**
- Create new contacts with email and custom fields
- Update existing contacts
- Bulk import functionality
- Custom field support
- Contact list management

**Required Fields:**
- `email` (string) - Contact email address

**Optional Fields:**
- `first_name` (string) - First name
- `last_name` (string) - Last name
- `custom_fields` (object) - Custom field values
- `list_ids` (array) - Lists to add contact to

---

### 3. ListContacts
**Endpoint:** `GET /v3/marketing/contacts`

Retrieve a list of all contacts from Marketing Campaigns.

**Key Features:**
- Paginated results
- Search and filter capabilities
- Contact count retrieval
- Export functionality

**Optional Query Parameters:**
- `page_size` (integer) - Results per page (default: 100, max: 500)
- `limit` (integer) - Maximum results to return

---

### 4. GetContact
**Endpoint:** `GET /v3/marketing/contacts/{contact_id}`

Retrieve a specific contact by its ID.

**Key Features:**
- Fetch complete contact information
- View custom fields
- Check contact status

---

### 5. SearchContacts
**Endpoint:** `POST /v3/marketing/contacts/search`

Search for contacts based on query criteria.

**Key Features:**
- Advanced search with filters
- Query builder support
- Flexible filtering options

**Required Fields:**
- `query` (string) - Search query

---

### 6. DeleteContact
**Endpoint:** `DELETE /v3/marketing/contacts`

Delete one or more contacts from the system.

**Key Features:**
- Bulk deletion support
- Contact ID removal

**Required Fields:**
- `ids` (array) - Contact IDs to delete

---

### 7. CreateTemplate
**Endpoint:** `POST /v3/templates`

Create a new email template.

**Key Features:**
- Dynamic template support
- Template versioning
- HTML and plain text content
- Template cloning
- Up to 300 templates per account

**Required Fields:**
- `name` (string) - Template name

**Optional Fields:**
- `generation` (string) - Template generation type ('dynamic' or 'legacy')

---

### 8. ListTemplates
**Endpoint:** `GET /v3/templates`

Retrieve all email templates.

**Key Features:**
- List all templates
- Paginated results
- Retrieve template details

**Optional Query Parameters:**
- `generations` (string) - Filter by generation type
- `page_size` (integer) - Results per page

---

### 9. GetTemplate
**Endpoint:** `GET /v3/templates/{template_id}`

Retrieve a specific email template.

**Key Features:**
- View template details
- Check template versions
- Retrieve template content

---

### 10. DeleteTemplate
**Endpoint:** `DELETE /v3/templates/{template_id}`

Delete an email template.

**Key Features:**
- Permanently remove template
- Cascade deletion of versions

**Required Fields:**
- `template_id` (string) - ID of template to delete

---

## Essential Triggers (Webhooks/Polling)

### 1. NewEmail (Polling Trigger)
Monitor for new outbound emails or engagement events.

**Implementation Approach:**
- Poll the Email Activity Feed API (`GET /v3/messages`)
- Track timestamps to identify new events
- Return email events matching criteria

**Available Filters:**
- Event type (sent, delivered, open, click, etc.)
- Time range
- Sender/recipient addresses

---

### 2. EmailDelivered (Polling Trigger)
Trigger when an email is successfully delivered.

**Implementation Approach:**
- Poll Email Activity Feed for "delivered" events
- Filter by status = "delivered"
- Include delivery timestamps

---

### 3. EmailEvent (Polling Trigger)
Trigger on various email events (bounces, complaints, unsubscribes, etc.).

**Implementation Approach:**
- Monitor Email Activity Feed
- Support multiple event types
- Track event metadata (bounce reason, complaint type, etc.)

**Supported Event Types:**
- Bounce
- Complaint
- Unsubscribe
- Delivery failure

---

## Additional API Endpoints (For Future Components)

### Senders API
- `POST /v3/senders` - Create a sender identity
- `GET /v3/senders` - List all sender identities
- `GET /v3/senders/{sender_id}` - Get specific sender
- `PATCH /v3/senders/{sender_id}` - Update sender details
- `DELETE /v3/senders/{sender_id}` - Delete sender
- `POST /v3/senders/{sender_id}/resend_verification` - Resend verification email

### Template Versions API
- `POST /v3/templates/{template_id}/versions` - Create template version
- `GET /v3/templates/{template_id}/versions` - List versions
- `GET /v3/templates/{template_id}/versions/{version_id}` - Get version
- `PATCH /v3/templates/{template_id}/versions/{version_id}` - Update version
- `DELETE /v3/templates/{template_id}/versions/{version_id}` - Delete version

### Suppression Management APIs
- Blocks: `GET /v3/suppression/blocks`
- Bounces: `GET /v3/suppression/bounces`
- Invalid Emails: `GET /v3/suppression/invalid_emails`
- Spam Reports: `GET /v3/suppression/spam_reports`
- Unsubscribes: `GET /v3/suppression/unsubscribes`

### Email Activity Feed API
- `GET /v3/messages` - Retrieve email activity events
- Query parameters: `limit`, `offset`, `query`

### Statistics API
- `GET /v3/stats` - Get email statistics
- `GET /v3/stats/sums` - Get aggregated statistics

---

## Rate Limiting & Quotas

**General API Rate Limits:**
- Free accounts: 100 requests per day
- Paid accounts: Variable based on plan
- Email sending: Up to 100,000 emails per day (paid accounts)

**Rate Limit Headers:**
- `X-RateLimit-Limit` - Maximum requests in window
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Unix timestamp when limit resets

**Best Practices:**
- Implement exponential backoff for 429 (Too Many Requests) responses
- Monitor rate limit headers
- Batch operations when possible
- Respect 72-hour scheduled send limit

---

## Error Handling

### Common HTTP Status Codes

| Status | Meaning             | Action                        |
| ------ | ------------------- | ----------------------------- |
| 200    | OK                  | Request successful            |
| 201    | Created             | Resource created successfully |
| 202    | Accepted            | Email accepted for sending    |
| 400    | Bad Request         | Invalid request parameters    |
| 401    | Unauthorized        | Invalid API key               |
| 403    | Forbidden           | Insufficient permissions      |
| 404    | Not Found           | Resource not found            |
| 405    | Method Not Allowed  | Invalid HTTP method           |
| 413    | Payload Too Large   | Request body too large        |
| 429    | Too Many Requests   | Rate limit exceeded           |
| 500    | Server Error        | SendGrid server error         |
| 503    | Service Unavailable | Temporary service unavailable |

### Error Response Format
```json
{
  "errors": [
    {
      "message": "Invalid email address format",
      "field": "personalizations.0.to.0.email"
    }
  ]
}
```

---

## API Endpoint Categories

### Email Sending
- Mail Send (`POST /v3/mail/send`) - Send transactional emails

### Contacts Management
- Contacts API - Create, read, update, delete contacts

### Templates
- Transactional Templates API - Manage email templates

### Senders
- Senders API - Manage verified sender identities

### Activity & Statistics
- Email Activity Feed API - Query email events
- Statistics API - Get email statistics
- Suppressions API - Manage bounces, complaints, unsubscribes

### Suppressions
- Blocks
- Bounces
- Invalid Emails
- Spam Reports
- Unsubscribes

---

## Key Limitations & Considerations

1. **Email Sending Limits:**
   - Scheduled sends limited to 72 hours in advance
   - Maximum 1000 personalizations per request
   - Attachment size limits apply

2. **Contact Management:**
   - Maximum 300 templates per account
   - Rate limiting applies to bulk operations
   - Contact count limits vary by plan

3. **Template System:**
   - Dynamic templates (prefixed with `d-`) support Handlebars syntax
   - Legacy templates support substitution tags
   - Up to 300 versions per template

4. **API Constraints:**
   - Webhook events require account activation
   - Some features limited to specific pricing tiers
   - EU endpoints available for EU regional compliance

---

## Implementation Notes

### Component Development Priorities

1. **First (Core Email Functionality):**
   - SendEmail component
   - ListTemplates component

2. **Second (Contact Management):**
   - CreateContact component
   - ListContacts component
   - SearchContacts component

3. **Third (Advanced Features):**
   - GetContact component
   - DeleteContact component
   - CreateTemplate component
   - GetTemplate component
   - DeleteTemplate component

4. **Fourth (Triggers):**
   - NewEmail trigger (polling)
   - EmailDelivered trigger (polling)
   - EmailEvent trigger (polling)

### Testing Considerations

- Sandbox mode available via Mail Settings
- Test with sample emails before production
- Verify sender identity during development
- Use test API keys with limited permissions

### Security Best Practices

- Store API keys in environment variables
- Never log or display API keys
- Use API key scoping for limited permissions
- Implement request validation
- Use HTTPS for all requests
- Rotate API keys periodically

---

## References

- **SendGrid API Reference:** https://www.twilio.com/docs/sendgrid/api-reference
- **Mail Send API:** https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send
- **Contacts API:** https://www.twilio.com/docs/sendgrid/api-reference/contacts
- **Templates API:** https://www.twilio.com/docs/sendgrid/api-reference/transactional-templates
- **Senders API:** https://www.twilio.com/docs/sendgrid/api-reference/senders
- **Authentication:** https://www.twilio.com/docs/sendgrid/for-developers/sending-email/authentication
- **Email Activity Feed:** https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-email-activity-api
- **Onboarding Guide:** https://www.twilio.com/docs/sendgrid/onboarding/email-api

---

## Status

**Date Created:** November 18, 2025  
**Status:** Ready for Implementation  
**Components to Implement:** 10 Actions + 3 Triggers
