# HelpScout Connector Tests

This directory contains tests for the HelpScout connector components.

## Test Structure

- **customers.test.js** - Tests for customer-related components (GetCustomer, CreateCustomer, UpdateCustomer, FindCustomers)
- **conversations.test.js** - Tests for conversation-related components (GetConversation, CreateConversation, UpdateConversation, FindConversations)
- **messages.test.js** - Tests for message-related components (CreateThreadAgentReply, CreateThreadInternalNote)
- **mailbox.test.js** - Tests for mailbox-related components (ListMailboxes, ListEmails, ListTags, GetCurrentUser)
- **lib.test.js** - Tests for utility functions in lib.generated.js
- **integration.test.js** - Integration tests that make real API calls (optional, requires API token)
- **index.test.js** - Main test runner that loads all test suites

## Running Tests

### Unit Tests (Recommended)

Run unit tests that test component logic without making real API calls:

```bash
npm run test-unit -- "src/appmixer/helpscout/artifacts/test/customers.test.js" "src/appmixer/helpscout/artifacts/test/conversations.test.js" "src/appmixer/helpscout/artifacts/test/messages.test.js" "src/appmixer/helpscout/artifacts/test/mailbox.test.js"
```

Or run all unit tests using the index file:

```bash
npm run test-unit -- "src/appmixer/helpscout/artifacts/test/index.test.js"
```

### Integration Tests (Optional)

Integration tests require a real HelpScout API token and will make actual API calls to your HelpScout account.

1. Set your HelpScout API token:
```bash
export HELPSCOUT_ACCESS_TOKEN="your_helpscout_api_token_here"
```

2. Run integration tests:
```bash  
npm run test-unit -- "src/appmixer/helpscout/artifacts/test/integration.test.js"
```

**Warning**: Integration tests will make real API calls to your HelpScout account. They may read existing data but should not create or modify data in most cases.

## Authentication

The HelpScout connector uses OAuth 2.0 authentication as configured in `auth.js`.

### Getting API Credentials

1. Go to [HelpScout Developer Portal](https://developer.helpscout.com/)
2. Create a new app or use existing app
3. Get your OAuth credentials or API token
4. Configure authentication as needed

## Component Coverage

### Customer Management
- **CreateCustomer** - Create new customers
- **GetCustomer** - Retrieve customer details
- **UpdateCustomer** - Update customer information  
- **FindCustomers** - Search for customers

### Conversation Management
- **CreateConversation** - Create new conversations
- **GetConversation** - Retrieve conversation details
- **UpdateConversation** - Update conversation properties
- **FindConversations** - Search for conversations

### Message Management
- **CreateThreadAgentReply** - Post agent replies to conversations
- **CreateThreadInternalNote** - Add internal notes to conversations

### Mailbox Operations
- **ListMailboxes** - List available mailboxes
- **ListEmails** - List customer emails
- **ListTags** - List available tags
- **GetCurrentUser** - Get current authenticated user details

## Test Environment

Tests use mock contexts by default and can be run without API credentials. For integration testing with real API calls, set the `HELPSCOUT_ACCESS_TOKEN` environment variable.