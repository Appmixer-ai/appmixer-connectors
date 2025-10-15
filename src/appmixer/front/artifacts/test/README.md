# Front Connector Tests

This directory contains tests for the Front connector components.

## Test Structure

- **contacts.test.js** - Tests for contact-related components (GetContact, CreateContact, UpdateContact, DeleteContact, FindContacts)
- **messages.test.js** - Tests for message-related components (GetMessage, CreateMessage, ReplyMessage)  
- **conversation.test.js** - Tests for conversation-related components (FindConversations, GetConversation, UpdateConversation)
- **integration.test.js** - Integration tests that make real API calls (optional, requires API token)
- **index.test.js** - Main test runner that loads all test suites

## Running Tests

### Unit Tests (Recommended)

Run unit tests that test component logic without making real API calls:

```bash
npm run test-unit -- "src/appmixer/front/artifacts/test/contacts.test.js" "src/appmixer/front/artifacts/test/messages.test.js" "src/appmixer/front/artifacts/test/conversation.test.js"
```

Or run all unit tests using the index file:

```bash
npm run test-unit -- "src/appmixer/front/artifacts/test/index.test.js"
```

### Integration Tests (Optional)

Integration tests require a real Front API token and will make actual API calls to your Front account.

1. Set your Front API token:
```bash
export FRONT_ACCESS_TOKEN="your_front_api_token_here"
```

2. Run integration tests:
```bash  
npm run test-unit -- "src/appmixer/front/artifacts/test/integration.test.js"
```

**Warning**: Integration tests will make real API calls to your Front account. They may read existing data but should not create or modify data in most cases.

## Authentication

The Front connector supports two authentication methods:

### 1. OAuth 2.0 (Default)
Configured in `auth.js` - provides secure token-based authentication via Front's OAuth flow.

### 2. API Token (For Testing)
Configured in `auth-apiToken.js` - allows direct API token authentication using the `FRONT_ACCESS_TOKEN` environment variable.

## Test Coverage

The tests cover:

✅ **Input validation** - Ensures required fields are validated  
✅ **Component existence** - Verifies all components load properly  
✅ **Error handling** - Tests proper error responses for invalid inputs  
✅ **Output port options** - Tests dynamic schema generation  
✅ **Integration scenarios** - Basic API connectivity and error handling

## Test Framework

- **Mocha** - Test runner
- **Assert** - Assertion library (Node.js built-in)
- **Sinon** - Mocking library (via test utils)

## Front API Components Tested

### Contacts
- `FindContacts` - Search and list contacts with filtering
- `GetContact` - Retrieve a specific contact by ID  
- `CreateContact` - Create new contacts with handles and metadata
- `UpdateContact` - Update existing contact information
- `DeleteContact` - Delete contacts by ID

### Messages  
- `GetMessage` - Retrieve message details by ID
- `CreateMessage` - Send new messages through channels
- `ReplyMessage` - Reply to existing messages

### Conversations
- `FindConversations` - Search conversations with status/inbox filters
- `GetConversation` - Get full conversation details by ID
- `UpdateConversation` - Update conversation status/assignment

## Contributing

When adding new components:

1. Add the component import to the appropriate test file
2. Create test cases for input validation and basic functionality  
3. Add integration test cases if the component modifies data
4. Update this README with the new component information
