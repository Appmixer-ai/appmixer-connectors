# Retool Connector Testing

## Environment Setup

Create a `.env` file in the test directory with:

```
RETOOL_BASE_URL=https://your-retool-domain.com
RETOOL_ACCESS_TOKEN=your_api_token_here
```

## Getting Your Retool API Token

1. Log into your Retool organization
2. Navigate to Settings > API tokens
3. Click "Create API token"
4. Provide a name and description for the token
5. Select appropriate permissions/scopes
6. Copy the generated token (it will only be shown once)

## Running Tests

From the root directory of the project:

```bash
# Run all Retool tests
npm test -- --grep "retool"

# Run specific test file
npm test test/retool/FindApps.test.js

# Run with more verbose output
npm test -- --grep "retool" --reporter spec
```

## Test Coverage

The test suite covers:

- **Authentication**: Validates API token and profile retrieval
- **FindApps**: Tests app listing, filtering, and output port schema generation
- **GetAppDetails**: Tests retrieving specific app information
- **InviteUser**: Tests user invitation functionality (mocked to avoid spam)

## Notes

- Tests use real API calls to verify actual functionality
- Some tests may be skipped if no test data is available
- InviteUser tests are mocked to prevent sending actual invitations
- Make sure your API token has appropriate permissions for all tested operations