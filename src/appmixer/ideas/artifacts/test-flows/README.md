# IDeaS E2E test flows

**None of these flows has ever run. No request of this connector has reached an IDeaS
environment with credentials, and IDeaS has never posted a processing result to it.** The
IDeaS Public API is open only to integration partners that IDeaS onboards, and no test
environment existed when the connector was built. The connector was not published to any
Appmixer instance.

Both flows pass `appmixer e2e validate`, and that is all. Treat them as prepared, not as proof.

What did run:

- 42 unit tests in `artifacts/test/ideas.test.js` (also on Node 18), with a mocked HTTP
  client, a mocked component context and a mocked plugin context.
- The three Send components, unchanged, against the public schema validation service
  `https://api-mock-service.ideasrms.com` on 2026-11-27, one request each, with the
  documentation's reservation sample and a group and an inventory item written for the test.
  All three answered `202 {"status":"success"}`. One more request with an incomplete
  inventory item was refused with the missing fields listed in the `sl-violations` header,
  which the connector turns into its error message.

What the schema validation service proves: the payloads the connector builds conform to the
published OpenAPI schema of the three operations. Nothing more. It is a Stoplight Prism mock:
it takes no credentials, has no token endpoint, does not check the `ReplyTo` header (a request
without it is accepted too), returns no tracker ID and never calls back. It says nothing about
the token endpoint, the chain and hotel code check, the business validation in the RMS, the
processing result, or how IDeaS calls the `ReplyTo` URL.

One finding from it: the documentation's own reservation sample is **rejected** by the mock as
published (`cancellationDateTime`, `cancellationReason`, `multiReservationId` and
`profiles[].context` are `null`, the schema wants strings). The connector leaves out optional
fields that are null, so the sample goes through.

## The flows

### test-flow-send-data.json

- Covers Send Inventory, Send Reservations and Send Group Blocks.
- Sends one inventory date (tomorrow), one reservation (`E2E-RES-0001`, arriving in 30 days)
  and one group (`E2E-GRP-0001`, in 60 days) and asserts both ports of each component: `out`
  (accepted, Correlation ID echoed) and `done` (status `SUCCESS`, Correlation ID echoed).
- The room type, market segments, rate code and source in the payloads (`DBL`, `BAR`, `GRP`,
  `WEB`) must exist in the configuration of the test property. Replace them with the codes
  IDeaS set up for it.
- AfterAll waits 15 minutes for the processing results. IDeaS publishes no processing time.
- Nothing is cleaned up: the API has no delete. The reservation and the group keep fixed IDs,
  so every run updates the same records.
- Run against the schema validation service, the asserts on `out` pass and the ones on `done`
  time out.

### test-flow-make-api-call.json

- Covers Make API Call: one inventory date posted to `/api/public/v1/inventories` with a
  `ReplyTo` header set in the Request Headers input. IDeaS requires the header, so a 2xx
  shows that the header reached IDeaS (against the real API, not the mock).
- The `ReplyTo` URL points at the connector's reply route with a token that is not valid;
  IDeaS's result to it is answered 404. Make API Call never receives a result.
- The body names `TESTCLIENT` / `TESTHOTELCODE`; replace them with the codes of the test
  property.

## What a run needs

- Acceptance as an IDeaS integration partner, and from IDeaS for its test environment
  ("Interim Testing"): the Base URL (and a separate token URL, if IDeaS issues one), an OAuth
  Client ID and Client Secret, and the chain code and hotel code of a test property. Store
  them with `creds set ideas ...` in appmixer-test-credentials.
- If the hosts IDeaS issues are not under `ideasrms.com` or `ideas.com`: an administrator adds
  them to `additionalApiHosts` in the connector configuration `appmixer:ideas`.
- If IDeaS allow-lists callback URLs per partner: the reply route of the test instance,
  `<API URL of the instance>/plugins/appmixer/ideas/reply/`, registered with IDeaS.
- An IDeaS connection on the test instance with those values.

## Things only a run can settle

These are assumptions taken from the documentation.

- **Hosts.** No API or token host is published. The connector accepts HTTPS hosts under
  `ideasrms.com` (the mock's domain) and `ideas.com` (the vendor's domain), plus hosts an
  administrator allows.
- **Token endpoint.** `POST /api/uis/external_m2m/oauth2/token` on the Base URL host, form
  body with the client credentials, as documented with a redacted host. A different host can
  be set as Token URL.
- **Success status.** 202 on the operation pages, 201 in the request guide, 204 in the
  response guide. Any 2xx is taken as accepted.
- **Tracker ID.** The 202 body is documented as the "UUID of request" (a string). A plain
  string is taken as the tracker ID; any JSON body (the request guide shows one) leaves it
  empty. The result is delivered either way: it is matched by the reply token, not by the
  tracker ID.
- **The callback.** Documented as `REST PUT` to the `ReplyTo` URL with `{status, description}`
  (message flow diagram) and as `POST /trackers/{trackerId}` with `{status, messages[]}`
  (Tracker API). The reply route accepts PUT and POST, on the URL as it is and with
  `/trackers/<trackerId>` appended, and reads both body shapes. Whether IDeaS calls arbitrary
  HTTPS URLs or only allow-listed ones is not documented.
- **Callback authentication.** IDeaS documents none. The only credential is the reply token in
  the URL: HMAC-SHA256 with a key derived from the Client Secret, bound to the flow, the
  component, the message that sent the data and a 7-day window. Whoever learns the URL can
  post a result for that one message until it expires; it is the same exposure as any
  callback URL.
- **Client Secret rotation.** A result for data sent before the secret was changed in the
  connection fails the token check and is answered 404.
- **Token budget.** IDeaS recommends at most 6 token requests an hour. The connector keeps the
  token, encrypted, in the connector's service state, shared by every flow of the same
  credentials, and sends no seventh request within an hour. Checking a connection requests a
  token too (the auth context has no store).
- **Refused tokens.** A 401 or 403 replaces the cached token once, and only when it is at least
  10 minutes old, so that a wrong chain or hotel code does not use up the budget.
- **Rate limit.** Not published. The quota is 5 requests a second per user, a number of this
  connector.
- **Results that never come.** If IDeaS does not post a result (or posts it while the flow is
  stopped), Done never fires for that message. There is no timeout.
- **Duplicates.** A result posted twice reaches Done twice, with the same Correlation ID.
