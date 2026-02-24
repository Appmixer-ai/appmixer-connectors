# Google Ads - Customer Match Upload

Appmixer connector for uploading Customer Match data (hashed emails) to Google Ads User Lists from CSV files.

## Architecture

```
ads/
├── CustomerMatchUpload/
│   ├── CustomerMatchUpload.js   # Main component logic
│   └── component.json           # Component config, ports, schema
├── auth.js                      # OAuth2 with adwords scope (extends google/auth.js)
├── lib.js                       # API calls, retry, rate limit, logging
├── csvParser.js                 # CSV chunk reading, column detection, row counting
├── retry.js                     # Generic retry with exponential backoff
├── bundle.json                  # Bundle metadata
├── module.json                  # Module metadata
└── package.json                 # Dependencies
```

## Authentication (OAuth2)

The component uses Appmixer's built-in OAuth2 system. **No manual credentials are passed as input parameters.**

### How it works

1. `ads/auth.js` extends the base `google/auth.js` OAuth2 flow, adding the `https://www.googleapis.com/auth/adwords` scope
2. `component.json` declares `"auth": { "service": "appmixer:google", "scope": ["https://www.googleapis.com/auth/adwords"] }`
3. At runtime, the component accesses credentials via `context.auth`:
   - `context.auth.clientId` — from backoffice service config
   - `context.auth.clientSecret` — from backoffice service config
   - `context.auth.accessToken` — per-user, auto-refreshed by Appmixer
   - `context.auth.refreshToken` — per-user, from OAuth2 consent flow

### Backoffice Setup

1. Go to **Appmixer Backoffice** → **Service Config** (e.g. `https://<your-instance>/dashboard/service-config`)
2. Find or create the `appmixer:google` service entry
3. Set the **Client ID** and **Client Secret** from your Google Cloud Console OAuth2 credentials
   - The OAuth2 app must have the Google Ads API enabled
   - Authorized redirect URI must match your Appmixer callback URL
4. The **Developer Token** is a Google Ads API-specific credential — it is passed as a component input parameter (not part of OAuth2)

### Component Input Parameters (after OAuth2 migration)

| Parameter | Source | Description |
|-----------|--------|-------------|
| `fileId` | Input | CSV file ID from Appmixer storage |
| `developerToken` | Input | Google Ads API Developer Token |
| `loginCustomerId` | Input (optional) | Manager/MCC account ID |
| `customerId` | Input | Google Ads account ID |
| `segmentToUserList` | Input | JSON mapping of segment names → User List IDs |
| `uploadMode` | Input | REPLACE or ADD |
| `batchSize` | Input | Batch size (default: 10000) |
| `clientId` | `context.auth` | From backoffice — **NOT an input** |
| `clientSecret` | `context.auth` | From backoffice — **NOT an input** |
| `refreshToken` | `context.auth` | Per-user OAuth2 — **NOT an input** |

### Continuation State

Credentials are **not** stored in the continuation payload. On each continuation, `context.auth` provides fresh credentials automatically. The continuation payload only carries:
- `fileId`, `developerToken`, `loginCustomerId`, `customerId`, `segmentToUserList`
- `uploadMode`, `batchSize`, `columnSeparator`
- Processing state: `lastProcessedRow`, `segmentProgress`, `totalUsersUploaded`, `totalRows`, `jobsAlreadyRun`, `errors`, `rateLimitUntil`

## Key Features

- **Chunk-based CSV processing**: Reads CSV in chunks (batchSize × 5 rows), groups by segment, uploads batches. Reopens file stream per chunk for reliability.
- **Continuation pattern**: Uses `context.setTimeout()` to handle uploads exceeding 10-minute execution windows. Persists state across continuations. Supports up to 48h total upload time.
- **Rate limit handling**: Detects Google Ads API "Too many requests" with large retry delays (>60s). Freezes chunk processing, reschedules continuations every 5 minutes until cooldown expires.
- **Throttled progress**: Consolidated progress message every 5 seconds with ETA, percentage, per-segment breakdown.
- **Smart retry**: Exponential backoff for transient errors, recursive batch splitting for non-retryable errors.
- **Graceful stop**: `stop()` hook cancels pending continuation timeouts.

## Dependencies

- `google-ads-api` ^21.0.1
- `csv-parse` ^5.6.0

## PR #925 Review Status

| # | Issue | Status |
|---|-------|--------|
| 🔴1 | Auth bypasses Appmixer OAuth2 | ✅ Fixed — uses `context.auth` + backoffice config |
| 🔴2 | Missing `lib.js` helper file | ✅ Extracted to `lib.js`, `csvParser.js`, `retry.js` |
| 🔴3 | No test coverage | ⚠️ Pending — E2E test flows needed |
| 🟡4 | Continuation complexity | ✅ Documented, hardcoded constants |
| 🟡5 | Memory concerns | ✅ Chunk-based processing |
| 🟡6 | Silent error swallowing | ✅ Errors logged in `safeSendProgress` |
| 🟡7 | `quota.js` unused | ✅ Removed |
| 🟢8 | Input validation | ✅ `context.CancelError` for all validation |
| 🟢9 | Large component file | ✅ Split into modules |
| 🟢10 | Author field typo | ✅ Fixed |

## Testing (Pending)

E2E test flows should follow the Appmixer pattern:
`OnStart → Components → Assert → AfterAll → Cleanup → ProcessE2EResults`

Key scenarios:
1. Small CSV upload (100 rows, 3 segments) → success
2. Large CSV triggering continuation → resumes correctly
3. Rate limit → freeze, cooldown, resume
4. Validation errors → proper `CancelError` messages
5. Edge cases: empty CSV, unmapped segments
