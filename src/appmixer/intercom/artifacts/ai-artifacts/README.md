# Intercom Connector

This connector provides integration with the Intercom platform, allowing you to manage contacts, companies, conversations, and messaging within your Appmixer workflows.

## Authentication

The connector uses Bearer token authentication. You'll need to provide:
- Access Token: Your Intercom access token

## Components

### Contact Management

#### CreateContact
Creates a new contact in your Intercom workspace.

**Required Fields:**
- `email`: Contact's email address
- `name`: Contact's name (optional but recommended)

**Example:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

#### FindContacts
Search for contacts in your workspace.

**Required Fields:**
- `query`: Search query string

**Example:**
```json
{
  "query": "john"
}
```

#### GetContact
Retrieve detailed information about a specific contact.

**Required Fields:**
- `contactId`: The ID of the contact to retrieve

#### UpdateContact
Update an existing contact's information.

**Required Fields:**
- `id`: The contact ID to update
- Additional fields as needed (name, email, phone, etc.)

**Example:**
```json
{
  "id": "contact_123",
  "name": "Updated Name"
}
```

### Admin Management

#### ListAdmins
Retrieve all admins in your Intercom workspace.

**Optional Fields:**
- `outputType`: How to return results ("array", "first", "object")

### Company Management

#### CreateUpdateCompany
Create or update a company in your workspace.

**Required Fields:**
- `company_id`: Unique identifier for the company
- `name`: Company name

**Example:**
```json
{
  "company_id": "company_123",
  "name": "Acme Corp",
  "website": "https://acme.com"
}
```

#### FindCompanies
List all companies in your workspace.

**Optional Fields:**
- `outputType`: How to return results ("array", "first", "object")

#### GetCompany
Retrieve detailed information about a specific company.

**Required Fields:**
- `id`: The company ID to retrieve

### Conversation Management

#### FindConversations
Search for conversations using Intercom's query syntax.

**Required Fields:**
- `query`: JSON query string following Intercom's search format

**Example:**
```json
{
  "query": "{\"field\":\"state\",\"operator\":\"=\",\"value\":\"open\"}"
}
```

#### GetConversation
Retrieve detailed information about a specific conversation.

**Required Fields:**
- `id`: The conversation ID to retrieve

#### CreateConversation
Create a new conversation.

**Required Fields:**
- `from_type`: Type of sender ("user" or "admin")
- `from_id`: ID of the sender
- `body`: Message content

**Example:**
```json
{
  "from_type": "user",
  "from_id": "contact_123",
  "body": "Hello, I need help with my account"
}
```

#### ReplytoConversation
Add a reply to an existing conversation.

**Required Fields:**
- `id`: Conversation ID
- `reply_type`: Type of reply ("admin" or "user")
- `body`: Reply content
- `admin_id`: Admin ID (required for admin replies)

**Example:**
```json
{
  "id": "conversation_123",
  "reply_type": "admin",
  "body": "Thanks for contacting us!",
  "admin_id": "admin_456"
}
```

### Messaging

#### SendMessage
Send a message to a contact.

**Required Fields:**
- `from_admin_id`: ID of the admin sending the message
- `to_contact_id`: ID of the contact receiving the message
- `message_type`: Type of message ("in_app" or "email")
- `body`: Message content

**For Email Messages (additional required fields):**
- `subject`: Email subject line
- `template`: Email template ("plain" or "personal")

**Example (In-App):**
```json
{
  "from_admin_id": 123456,
  "to_contact_id": "contact_123",
  "message_type": "in_app",
  "body": "Welcome to our platform!"
}
```

**Example (Email):**
```json
{
  "from_admin_id": 123456,
  "to_contact_id": "contact_123",
  "message_type": "email",
  "body": "Welcome to our platform!",
  "subject": "Welcome Message",
  "template": "plain"
}
```

### Tag Management

#### ListTags
Retrieve a list of all tags for the workspace.

**No input fields required** - This component fetches all available tags.

**Output:**
- Returns an array of tag objects with the following properties:
  - `id`: Unique tag identifier
  - `name`: Tag name
  - `type`: Always "tag"
  - `applied_at`: When the tag was applied (if applicable)
  - `applied_by`: Who applied the tag (if applicable)

**Example Output:**
```json
{
  "tags": [
    {
      "type": "tag",
      "id": "12215915",
      "name": "Feature Request"
    }
  ]
}
```

**Use Cases:**
- Get all available tags for displaying in UI dropdowns
- Audit tag usage across your workspace
- Build tag-based filtering systems

## Field Naming Conventions

When using these components, note the following field naming patterns:

- Most components expecting entity IDs use the `id` field
- UpdateContact requires `id` field (not `contactId`)
- GetCompany requires `id` field (not `companyId`)
- GetConversation requires `id` field (not `conversationId`)
- SendMessage uses specific field names: `from_admin_id`, `to_contact_id`

## Output Types

Many list components support different output types:

- `"array"`: Returns all results in a single array
- `"first"`: Returns only the first result
- `"object"`: Returns items one at a time

## Error Handling

The connector includes proper error handling for:
- Missing required fields
- Invalid IDs
- Authentication errors
- API rate limiting (via quota management)

## Validation Status

✅ **All Components Validated**: All 14 components have been thoroughly tested with multiple scenarios  
✅ **Authentication**: Working correctly with Bearer token  
✅ **API Integration**: All endpoints responding properly  
✅ **Data Validation**: Input/output schemas working as expected  

See [VALIDATION-REPORT.md](./VALIDATION-REPORT.md) for detailed test results and examples.

## Recent Updates

- **September 2025**: Added `ListTags` component for tag management
- **September 2025**: Renamed `FindAdmins` to `ListAdmins` for consistency
- **September 2025**: Enhanced `SendMessage` component for improved API compliance
- **September 2025**: Comprehensive validation of all components completed

## Usage Examples

### Basic Contact Workflow
1. Use `CreateContact` to add a new contact
2. Use `FindContacts` to search for existing contacts
3. Use `UpdateContact` to modify contact information
4. Use `SendMessage` to communicate with the contact

### Conversation Management Workflow
1. Use `FindConversations` to search for open conversations
2. Use `GetConversation` to get conversation details
3. Use `ReplytoConversation` to respond to customers
4. Use `CreateConversation` to initiate new conversations

### Company Management Workflow
1. Use `CreateUpdateCompany` to add company information
2. Use `FindCompanies` to list all companies
3. Use `GetCompany` to get detailed company information

## Support

For technical support or questions about the Intercom connector, please refer to:
- [Intercom API Documentation](https://developers.intercom.com/)
- Component validation report for tested scenarios
- Appmixer documentation for general connector usage
