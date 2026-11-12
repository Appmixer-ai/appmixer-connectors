# Greenhouse connector

This connector calls the [Greenhouse Harvest v3 API](https://harvestdocs.greenhouse.io/reference) at `https://harvest.greenhouse.io/v3`. Harvest v1 and v2 no longer accept requests, so the connector uses v3 only.

## Authentication

Harvest v3 custom integrations use the OAuth 2.0 client credentials grant. A Greenhouse admin creates the credential:

1. In Greenhouse, go to **Configure > Dev Center > API Credential Management** and click **Create new API credentials**.
2. Choose **Harvest V3 (OAuth)** and save. Grant the credential the permissions for the endpoints your flows use (candidates, applications, jobs, job interview stages, rejection reasons, offers).
3. Enter the **Client ID** and **Client Secret** in Appmixer.

The connector exchanges them at `https://auth.greenhouse.io/token` for a bearer token. Appmixer requests a new token before the old one expires; a token the API rejects with 401 is replaced once per request. Requests run as the integration user Greenhouse creates for the credential, which has organization-wide access. A missing permission returns 403.

## Components

| Component | Endpoint | Notes |
| -- | -- | -- |
| Create Candidate | `POST /v3/candidates` | With a job, the candidate gets an application on it; without one, the candidate is a prospect. Returns the candidate and `applicationId`. |
| Get Candidate | `GET /v3/candidates?ids=` | v3 has no `GET /candidates/{id}`. |
| Find Candidates | `GET /v3/candidates` | Email, tag, created after or updated after. Up to 500. |
| Update Candidate | `PATCH /v3/candidates/{id}` | Email, phone and tags replace the existing lists. |
| Delete Candidate | `DELETE /v3/candidates/{id}` | Deletes all applications of the candidate too. |
| Find Jobs | `GET /v3/jobs` | Status, requisition ID. Up to 500. |
| List Job Stages | `GET /v3/job_interview_stages?job_ids=` | In plan order. |
| Find Applications | `GET /v3/applications` | Candidate, job, status, updated after. Up to 500. |
| Get Application | `GET /v3/applications?ids=` | |
| Move Application | `POST /v3/applications/{id}/move` | Empty Stage and Transfer To Job = advance to the next stage. `from_stage_id` defaults to the application's `job_interview_stage_id`. |
| Reject Application | `POST /v3/applications/{id}/reject` | Rejection reason and notes; no rejection email. |
| List Rejection Reasons | `GET /v3/rejection_reasons?include_defaults=true` | |
| List Offers | `GET /v3/offers?current_only=true` | Latest version of each offer. |
| Make API Call | Any path on `https://harvest.greenhouse.io` | Other hosts are refused. |
| New Candidate (trigger) | `GET /v3/candidates?created_at=gte\|…` | Polls every minute. |
| Updated Application (trigger) | `GET /v3/applications?updated_at=gte\|…` | Polls every minute; optional job and status filters. |

## Limits

- List endpoints return pages of up to 500 records; Find and List components return the first page (newest first, Harvest orders by id descending). Triggers follow the `Link` header for up to 10 pages per poll and send the filters only on the first request, as v3 requires.
- Harvest v3 limits requests per credential in 30-second windows. The quota allows 60 requests per 30 seconds per user, and a `429` is retried after `Retry-After` (up to 30 seconds, twice).
- Greenhouse web hooks cannot be registered through the API, so the triggers poll instead.

## Tests

`artifacts/test/greenhouse.test.js` has unit tests with the network mocked. `artifacts/test-flows/` has end-to-end flows for every component; the applications flow needs an open job in the account (see the note in the flow).
