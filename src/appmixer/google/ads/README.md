# Google Ads - Customer Match Upload

Appmixer connector for uploading Customer Match data (hashed emails) to Google Ads User Lists from CSV files.

## Architecture

```
ads/
├── CustomerMatchUpload/
│   ├── CustomerMatchUpload.js   # Main component logic
│   └── component.json           # Component config, ports, schema
├── auth.js                      # OAuth2 authentication (currently manual credentials)
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

## PR #925 Review Status

### ✅ Addressed

| # | Issue | Resolution |
|---|-------|------------|
| 🔴2 | Missing `lib.js` helper file | Extracted to `lib.js`, `csvParser.js`, `retry.js` |
| 🔴3 | No test coverage | **Pending** — needs E2E test flows |
| 🟡4 | Timeout continuation complexity | Documented, hardcoded constants with clear comments |
| 🟡5 | Memory concerns (large files) | Chunk-based processing (batchSize×5 rows per chunk), no full-file load |
| 🟡6 | Silent error swallowing | `safeSendProgress` and `safeLog` now log errors |
| 🟡7 | `quota.js` unused | Removed — rate limiting handled in `lib.js` |
| 🟢8 | Input validation | `segmentToUserList` validated, `context.CancelError` for validation errors |
| 🟢9 | Large component file | Split into `lib.js` (API), `csvParser.js` (parsing), `retry.js` (backoff) |
| 🟢10 | Author field typo | Fixed (`->` removed) |
| Inline | `safeSendProgress` silent catch | Logs errors at debug level |
| Inline | Environment variable constants | Hardcoded with sensible defaults and clear comments |
| Inline | `context.CancelError` for validation | Used for all validation errors |
| Inline | Memory/streaming concern | Chunk-based with skip-rows pattern per vtalas suggestion |
| vtalas | Core algorithm pattern | Matches exactly: iterate CSV → measure time → timeout+skip → sendJson |

### ⚠️ Pending

| # | Issue | Notes |
|---|-------|-------|
| 🔴1 | **Auth bypasses Appmixer OAuth2** | Currently uses manual credentials (clientId, clientSecret, refreshToken) as input params. Needs dedicated `auth.js` extending Google OAuth2 with `adwords` scope, using `context.auth`. See existing `/src/appmixer/google/auth.js` for pattern. |
| 🔴3 | **No test coverage** | Need E2E test flows: `OnStart → Components → Assert → AfterAll → Cleanup → ProcessE2EResults` |

### Auth Migration Plan

The current `auth.js` in this directory is a copy of the component's credential-based auth. To address PR feedback:

1. Create a new `auth.js` that extends the Google OAuth2 flow (`/src/appmixer/google/auth.js`) with the `https://www.googleapis.com/auth/adwords` scope
2. Update `component.json` to reference the auth module and remove credential input fields
3. Update `CustomerMatchUpload.js` to use `context.auth` instead of manual credential params
4. This is a **breaking change** — existing flows using manual credentials will need reconfiguration

## Testing

Tests should be created following the Appmixer E2E pattern. Key scenarios:

1. **Happy path**: Small CSV (100 rows, 3 segments) → uploads all → runs jobs → outputs results
2. **Continuation**: Large CSV that triggers timeout → continuation resumes correctly
3. **Rate limit**: Mock rate limit error → verify freeze, cooldown, resume
4. **Validation**: Missing fileId, invalid credentials, malformed segmentToUserList
5. **Edge cases**: Empty CSV, single-row CSV, unmapped segments, duplicate emails
