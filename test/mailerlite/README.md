# Mailerlite Connector Tests

This directory contains comprehensive tests for the Mailerlite connector components following the standard Appmixer test structure.

## Prerequisites

1. **Environment Setup**: Ensure the test environment variables are set in `test/.env`:
   ```
   MAILERLITE_ACCESS_TOKEN=your_token_here
   MAILERLITE_SUBSCRIBER_ID=optional_test_subscriber_id
   ```

2. **Dependencies**: Ensure required npm packages are installed:
   ```bash
   npm install mocha axios dotenv
   ```

## Test Structure

Each component has its own test file following the naming convention `ComponentName.test.js`:

- `FindGroups.test.js` - Tests group listing functionality
- `FindSubscribers.test.js` - Tests subscriber listing with various output types
- `CreateSubscriber.test.js` - Tests subscriber creation with validation
- `GetSubscriber.test.js` - Tests subscriber retrieval by ID and email
- `FindCampaigns.test.js` - Tests campaign listing functionality
- `CreateCampaign.test.js` - Tests campaign creation
- `GetCampaignStats.test.js` - Tests campaign statistics retrieval
- `SendCampaign.test.js` - Tests campaign sending (safely, with error handling)

## Running Tests

### Quick Validation
```bash
# Run a quick validation to check if components are working
node validate.js
```

### Individual Test Files
```bash
# Run a specific test file
npx mocha FindSubscribers.test.js --timeout 30000

# Run with detailed output
npx mocha FindSubscribers.test.js --timeout 30000 --reporter spec
```

### All Tests
```bash
# Run all tests
npx mocha *.test.js --timeout 30000

# Run with custom test runner
node runTests.js
```

### Test with Different Output Types
Each list component (FindSubscribers, FindGroups, FindCampaigns) tests multiple output types:
- `array` - Returns `{result: [...], count: N}`
- `object` - Sends each item individually with index/count
- `first` - Returns only the first item with index/count
- Output port options generation

## Test Features

### Real API Integration
- All tests use actual Mailerlite API calls (no mocking)
- Tests validate against real API responses
- Proper error handling for various HTTP status codes

### Comprehensive Coverage
- ✅ Authentication validation
- ✅ Input validation and error handling
- ✅ Multiple output types (array, object, first)
- ✅ Output port schema generation
- ✅ Component chaining (using data from one test in another)
- ✅ Edge cases (missing data, invalid IDs, etc.)

### Safety Measures
- CreateSubscriber uses unique timestamps in email addresses
- SendCampaign tests are designed to fail safely (preventing actual email sends)
- Non-destructive tests where possible

## Expected Results

### Successful Test Indicators
- ✅ No authentication errors (401)
- ✅ Proper JSON response structures
- ✅ Correct data types for all output fields
- ✅ Appropriate error handling for edge cases

### Common Test Scenarios

1. **Authentication Success**: All components authenticate successfully
2. **Data Retrieval**: List components return structured data
3. **Data Creation**: Create components return created entity details
4. **Error Handling**: Invalid inputs trigger appropriate CancelError exceptions
5. **API Errors**: HTTP errors (404, 422) are handled gracefully

## Test Data Management

### Global Variables
Tests use global variables to share data between test files:
- `global.testSubscriberId` - Created subscriber ID
- `global.testSubscriberEmail` - Created subscriber email
- `global.testGroupId` - First available group ID
- `global.testCampaignId` - First available campaign ID
- `global.testCreatedCampaignId` - Newly created campaign ID

### Cleanup
- Tests create minimal test data
- Subscriber emails use timestamps to avoid conflicts
- Created campaigns remain as drafts (not sent)

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   ```
   Error: Authentication failed: Access token is invalid or expired
   ```
   **Solution**: Check that MAILERLITE_ACCESS_TOKEN is correct and active

2. **404 Not Found**
   ```
   Subscriber/Campaign not found
   ```
   **Solution**: Normal for GetCampaignStats if campaign has no activity

3. **422 Validation Error**
   ```
   Email already exists / Invalid data
   ```
   **Solution**: Normal for CreateSubscriber if email exists

### Debug Mode
Add detailed logging by modifying test files:
```javascript
console.log('Request:', context.messages.in.content);
console.log('Response:', JSON.stringify(data, null, 2));
```

### Environment Check
```bash
# Verify environment variables
node -e "require('dotenv').config({path:'../.env'}); console.log('Token:', process.env.MAILERLITE_ACCESS_TOKEN ? 'SET' : 'NOT SET');"
```

## Test Coverage Status

| Component | Basic Tests | Error Handling | Output Types | Edge Cases |
|-----------|-------------|----------------|--------------|------------|
| FindGroups | ✅ | ✅ | ✅ | ✅ |
| FindSubscribers | ✅ | ✅ | ✅ | ✅ |
| CreateSubscriber | ✅ | ✅ | N/A | ✅ |
| GetSubscriber | ✅ | ✅ | N/A | ✅ |
| FindCampaigns | ✅ | ✅ | ✅ | ✅ |
| CreateCampaign | ✅ | ✅ | N/A | ✅ |
| GetCampaignStats | ✅ | ✅ | N/A | ✅ |
| SendCampaign | ⚠️ | ✅ | N/A | ✅ |

## Integration with CI/CD

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Test Mailerlite Connector
  env:
    MAILERLITE_ACCESS_TOKEN: ${{ secrets.MAILERLITE_ACCESS_TOKEN }}
    MAILERLITE_SUBSCRIBER_ID: ${{ secrets.MAILERLITE_SUBSCRIBER_ID }}
  run: |
    cd test/mailerlite
    npx mocha *.test.js --timeout 30000 --reporter json > test-results.json
```

---

**Note**: These tests validate the connector components against the real Mailerlite API v3. Ensure you have a valid API token and understand that some tests create test data in your Mailerlite account.
