# Mailerlite Connector Tests

## Quick Start

1. **Setup Environment**:
   ```bash
   # Create .env file in this directory
   cp .env.example .env
   # Edit .env and add your Mailerlite API token
   ```

2. **Validate Setup**:
   ```bash
   node validate.js
   ```

3. **Run All Tests**:
   ```bash
   node runTests.js
   ```

## Test Files

| File | Purpose | Status |
|------|---------|--------|
| `FindSubscribers.test.js` | Test subscriber listing/searching | ✅ |
| `CreateSubscriber.test.js` | Test subscriber creation | ✅ |
| `GetSubscriber.test.js` | Test individual subscriber retrieval | ✅ |
| `FindGroups.test.js` | Test group listing | ✅ |
| `FindCampaigns.test.js` | Test campaign listing | ✅ |
| `GetCampaignStats.test.js` | Test campaign statistics | ✅ |
| `SendCampaign.test.js` | Test campaign sending | ⚠️ Disabled |
| `CreateCampaign.test.js` | Test campaign creation | ⚠️ Manual |

## Prerequisites

- Valid Mailerlite account
- API token from Mailerlite dashboard
- Node.js with npm dependencies installed

## Environment Variables

Create a `.env` file in this directory with:

```bash
# Required: Your Mailerlite API token
MAILERLITE_ACCESS_TOKEN=your_token_here

# Optional: Existing subscriber ID for testing
MAILERLITE_SUBSCRIBER_ID=12345
```

## Component Status

All components are **production-ready** and tested against Mailerlite API v3:

- ✅ **Authentication**: Using Bearer token with API v3
- ✅ **Error Handling**: Proper validation and error messages  
- ✅ **Output Schemas**: Dynamic schema generation for array outputs
- ✅ **Real API Testing**: No mocking, tests actual API responses

## Safety Notes

- **SendCampaign**: Disabled in tests as it sends real emails
- **CreateCampaign**: Manual testing recommended
- **Test Data**: Creates minimal test data with unique timestamps
- **Cleanup**: Test subscribers can be manually deleted if needed

## Troubleshooting

1. **401 Errors**: Check your API token is valid and not expired
2. **404 Errors**: Normal for campaign stats on new/draft campaigns
3. **Rate Limits**: Tests include delays, wait if you hit limits
4. **Network Issues**: Ensure internet connection to Mailerlite API

Run `node validate.js` for detailed connection testing and troubleshooting.
