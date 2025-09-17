# Intercom Connector - Preparation Context

## Service Overview

Intercom is a customer messaging platform that provides live chat, marketing automation, and customer support tools. The API allows access to conversations, contacts, companies, messages, articles, and other customer data. Key features include managing conversations, creating and updating contacts, sending messages, and accessing customer support tickets.

**Official API Documentation:** https://developers.intercom.com/docs/references/introduction

## Authentication Method

**Type:** Bearer Token Authentication (Access Token)

**How it works:**
- Intercom uses Access Tokens for API authentication
- Tokens are provided when creating an app in the Intercom workspace
- Authentication is done via the `Authorization: Bearer <access_token>` header

**How to obtain Access Token:**
1. Create an app on your workspace at https://app.intercom.com/a/developer-signup
2. Find your Access Token in the Configure > Authentication section in your app within the Developer Hub
3. Alternative: Access tokens are also visible on the Test & Publish > Your Workspaces page

**Important Security Notes:**
- Access Tokens should be treated like passwords and never shared with third parties
- For public integrations, OAuth should be used instead of Access Tokens
- Access Tokens are suitable for private apps accessing your own workspace data

**Authentication Documentation:** https://developers.intercom.com/docs/build-an-integration/learn-more/authentication

## Planned Components

Based on the API documentation analysis, the following essential components should be implemented:

### Conversations Management
1. **ListConversations** - Retrieve all conversations with pagination support
2. **CreateConversation** - Create a new conversation initiated by a contact
3. **RetrieveConversation** - Get detailed information about a specific conversation
4. **UpdateConversation** - Update conversation properties like title, read status, custom attributes
5. **DeleteConversation** - Delete a conversation
6. **SearchConversations** - Search conversations using filters and criteria
7. **ReplyToConversation** - Reply to a conversation with a message from admin or contact
8. **ManageConversation** - Close, snooze, open, or assign conversations

### Contacts Management
9. **ListContacts** - Retrieve all contacts with pagination
10. **CreateContact** - Create a new contact (lead or user)
11. **RetrieveContact** - Get detailed information about a specific contact
12. **UpdateContact** - Update contact properties, custom attributes
13. **DeleteContact** - Delete a contact
14. **SearchContacts** - Search contacts using filters
15. **AttachContactToCompany** - Associate a contact with a company

### Companies Management
16. **ListCompanies** - Retrieve all companies
17. **CreateCompany** - Create a new company
18. **RetrieveCompany** - Get detailed information about a specific company
19. **UpdateCompany** - Update company properties and custom attributes
20. **DeleteCompany** - Delete a company
21. **SearchCompanies** - Search companies using filters

### Messages
22. **SendMessage** - Send messages to contacts (emails, in-app messages)
23. **ListMessages** - Retrieve sent messages

### Tags Management
24. **ListTags** - Retrieve all available tags
25. **CreateTag** - Create a new tag
26. **AttachTagToContact** - Add a tag to a contact
27. **DetachTagFromContact** - Remove a tag from a contact
28. **AttachTagToConversation** - Add a tag to a conversation
29. **DetachTagFromConversation** - Remove a tag from a conversation

### Notes
30. **ListContactNotes** - Retrieve notes for a specific contact
31. **CreateContactNote** - Add a note to a contact
32. **RetrieveNote** - Get details of a specific note

### Articles & Help Center
33. **ListArticles** - Retrieve all articles from the help center
34. **CreateArticle** - Create a new help center article
35. **UpdateArticle** - Update an existing article
36. **DeleteArticle** - Delete an article
37. **SearchArticles** - Search articles by content

### Teams & Admins
38. **ListTeams** - Retrieve all teams
39. **ListAdmins** - Retrieve all admin users
40. **RetrieveAdmin** - Get details of a specific admin

## API Characteristics

- **Base URL:** https://api.intercom.io/
- **API Version:** 2.14 (specified via Intercom-Version header)
- **Authentication:** Bearer token in Authorization header
- **Response Format:** JSON
- **Pagination:** Cursor-based pagination for most list endpoints
- **Rate Limiting:** API has rate limits that should be respected
- **Error Handling:** Standard HTTP status codes with detailed error messages

## Key API Features

1. **Pagination**: Most list endpoints support cursor-based pagination with `starting_after` parameter
2. **Search**: Advanced search capabilities for conversations, contacts, and companies with complex query filters
3. **Custom Attributes**: Support for custom attributes on contacts, companies, and conversations
4. **Webhooks**: Support for webhook integrations (not covered in this connector but available in the API)
5. **Bulk Operations**: Some endpoints support bulk operations for efficiency
6. **File Attachments**: Support for file attachments in conversations and messages

## Implementation Priority

### Phase 1 (Core Features):
- ListContacts, CreateContact, UpdateContact, RetrieveContact
- ListConversations, CreateConversation, RetrieveConversation, ReplyToConversation
- ListCompanies, CreateCompany, UpdateCompany, RetrieveCompany
- SendMessage

### Phase 2 (Extended Features):
- Search operations for contacts, conversations, companies
- Tag management operations
- Conversation management (close, assign, etc.)
- Notes management

### Phase 3 (Advanced Features):
- Articles and help center management
- Teams and admin management
- Delete operations
- Advanced conversation features

This connector will provide comprehensive integration with Intercom's customer messaging platform, enabling users to manage customer communications, contacts, and support workflows through Appmixer.