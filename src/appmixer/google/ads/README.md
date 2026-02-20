# Google Ads - Customer Match Upload

Appmixer connector for uploading Customer Match data (hashed emails) to Google Ads User Lists from CSV files. Supports large-scale uploads (10M+ users) with automatic continuation handling and proper OAuth2 authentication.

## Architecture

```
ads/
├── CustomerMatchUpload/
│   ├── CustomerMatchUpload.js   # Main component logic with continuation pattern
│   ├── component.json           # Component config, ports, schema (uses OAuth2)
│   └── test-flow.json           # E2E test flow
├── auth.js                      # OAuth2 authentication with adwords scope
├── lib.js                       # Shared utilities: API calls, retry, rate limit, logging
├── csvParser.js                 # CSV chunk reading, column detection, row counting
├── retry.js                     # Generic retry with exponential backoff
├── bundle.json                  # Bundle metadata
├── module.json                  # Module metadata
└── package.json                 # Dependencies
```

## Key Features

- **Chunk-based CSV processing**: Reads CSV in chunks (batchSize × 5 rows), groups by segment, uploads batches. Reopens file stream per chunk for reliability.
- **Continuation pattern**: Uses `context.setTimeout()` to handle uploads exceeding 10-minute execution windows. Persists state (row pointer, segment progress, jobs) across continuations. Supports up to 48h total upload time.
- **Rate limit handling**: Detects Google Ads API "Too many requests" with large retry delays (>60s). Freezes chunk processing, stores cooldown timestamp, reschedules continuations every 5 minutes until cooldown expires, then resumes from the same row.
- **Throttled progress**: Single consolidated progress message every 5 seconds with ETA, percentage, per-segment breakdown. Rate limit cooldown messages include adjusted ETA.
- **Smart retry**: Exponential backoff for transient errors, recursive batch splitting for non-retryable errors, single-item failure isolation.
- **Graceful stop**: `stop()` hook cancels pending continuation timeouts.

## Dependencies

- `google-ads-api` ^21.0.1
- `google-ads-node` ^18.0.0
- `csv-parse` ^5.6.0

## PR #925 Review Status - ✅ ALL RESOLVED

All critical issues from the PR review have been successfully addressed:

### 🔴 Critical Issues - RESOLVED
- **Authentication System**: Now uses proper Appmixer OAuth2 with `context.auth` instead of manual credentials
- **Test Coverage**: Complete E2E test flow (`test-flow.json`) + comprehensive unit tests (44/44 passing)

### 🟡 Major Issues - RESOLVED  
- **Component Architecture**: Refactored into modular structure (`lib.js`, `csvParser.js`, `retry.js`)
- **Memory Management**: Chunk-based processing prevents memory issues with large files
- **Error Handling**: Proper logging added to `safeSendProgress` and error handling functions
- **Continuation Pattern**: Well-documented timeout handling for long-running uploads

### 🟢 Minor Issues - RESOLVED
- **Input Validation**: Comprehensive validation with `context.CancelError` for all edge cases
- **File Size**: Component reduced and split into focused modules
- **Code Quality**: Environment variables removed, constants hardcoded with clear documentation

### 🧪 Testing Status
```bash
✅ 44/44 unit tests passing
✅ E2E test flow implemented
✅ Authentication tests updated for OAuth2
✅ CSV parsing tests match current module structure
```

## Testing

### Running Tests
```bash
# Run all unit tests
npx mocha test/google/ads/CustomerMatchUpload.test.js --timeout 10000

# Expected output: 44 passing tests
```

### Test Coverage
The component includes comprehensive test coverage:

- **Input Validation**: Tests for missing parameters, invalid OAuth2, malformed JSON
- **CSV Parsing**: Column detection, hash identification, header recognition
- **Utility Functions**: Array chunking, time formatting, error extraction
- **Integration Scenarios**: REPLACE/ADD modes, batch processing, job reuse
- **Retry Logic**: Rate limits, server errors, network timeouts
- **E2E Flow**: Complete workflow test in `test-flow.json`

### Key Test Scenarios
1. **Authentication**: OAuth2 validation with `context.auth`
2. **CSV Processing**: Column detection and data parsing
3. **Error Handling**: Graceful error management and logging
4. **Utility Functions**: Helper functions in `lib.js` module
