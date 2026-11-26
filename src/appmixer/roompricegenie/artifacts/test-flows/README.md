# RoomPriceGenie E2E test flows

**None of these flows has ever run. No request of this connector has reached RoomPriceGenie
with credentials, and RoomPriceGenie has never pushed an update to it.** The Open API is
open only to partners that RoomPriceGenie onboards, and no test account existed when the
connector was built.

The five flows pass `appmixer e2e validate`, and that is all. Treat them as prepared, not as
proof. The connector was not published to any Appmixer instance.

What did run:

- 122 unit tests in `artifacts/test/roompricegenie.test.js`, with a mocked HTTP client and
  a mocked plugin context. The inbound half is tested with RSA keys generated in the test,
  standing in for RoomPriceGenie's signing keys.
- One request without credentials: `GET https://refactoringdevapi.roompricegenie.com/integrations/jwk/`
  (the development host of the published Postman collection) answered
  `401 {"error":"not_authenticated", ...}` on 2026-11-26. It shows that the host exists and
  that the signing keys cannot be read without the Partner API Key. Nothing else.

## The flows

### test-flow-inventory.json

- Covers Send Inventory.
- Replaces the whole inventory of the connected property with two room types (`E2E-DBL`,
  `E2E-SGL`) and one rate plan (`E2E-BAR`). Use a sandbox property made for this test only.
- After the first run the rooms must be mapped by hand in the RoomPriceGenie sandbox
  account (Room Setup), or by RoomPriceGenie's team.

### test-flow-ari-updates.json

- Covers Send Availability, Send Rates, Send Restrictions, Send Reservations and Make API
  Call.
- Needs the mapping of the inventory flow to be confirmed by RoomPriceGenie.
- Writes availability, a price, a minimum stay and one reservation for the next days.
  Nothing is cleaned up: the API has no delete.
- Not covered here, covered by unit tests: the batch inputs (`... (JSON)`), occupancy
  prices, and the headers and query parameters of Make API Call (the API has no call on
  which a header or parameter changes the answer).

### test-flow-create-account.json

- Covers Create Account.
- Every run asks RoomPriceGenie for a real pending account and makes it send an activation
  email to `test@appmixer.ai`. There is no way to delete the request. Run it against the
  development environment only, and rarely.

### test-flow-trigger-new-rate-update.json and test-flow-trigger-new-restriction-update.json

- Cover New Rate Update and New Restriction Update.
- **Cannot provoke themselves.** An update is accepted only with a token signed by
  RoomPriceGenie's private key, so a flow cannot post a sample to the connector's own
  endpoint, and the connector has no switch to skip the check. A person has to click
  "Upload Prices" in the RoomPriceGenie sandbox account while the flow waits (10 minutes).
  The steps are in the sticky note of each flow.
- What the endpoint does with a valid update, a bad signature, a wrong algorithm, an
  expired token and an unknown property is covered by the unit tests.

## What a run needs

- RoomPriceGenie has accepted you as an Open API partner (welcome call, technical kickoff)
  and has issued, for its **development** environment:
    - the API base URL,
    - the Partner API Key (and partner ID),
    - a sandbox property account with its `client_id` and `client_secret`.
- On the test instance, the connector configuration `appmixer:roompricegenie` with
  `baseUrl` and `partnerApiKey` of that environment.
- A RoomPriceGenie connection on the test instance with the property code, client ID and
  client secret of the sandbox property. Store them with `creds set roompricegenie ...`
  in appmixer-test-credentials.
- For the trigger flows: RoomPriceGenie has registered
  `<API URL of the instance>/plugins/appmixer/roompricegenie/events` as your partner
  endpoint in the development environment, and somebody with access to the sandbox
  account's UI.
- Order of the first run: inventory, mapping in the RoomPriceGenie UI, ARI updates, the two
  trigger flows. Create Account is independent.

## Things only a run can settle

These are assumptions taken from the documentation.

### Calls to RoomPriceGenie

- **Base URL.** The production host is not published. The connector accepts any HTTPS host
  under `roompricegenie.com`; whether the hosts RoomPriceGenie hands out are all under that
  domain is not known.
- **Error answers.** Validation errors are documented as `{ errors: [{ type, loc, msg }] }`
  without an HTTP status; the connector treats such a body as a failure with any status.
  The shape of token errors (`error`, `error_description`) is taken from the one
  unauthenticated answer above.
- **Token lifetime and refresh.** 24 hours and a refresh token that dies after 7 days
  without use, as documented. The connector caches both and renews with the refresh grant.
  Whether a refresh rotates the refresh token is not documented; the connector stores
  whatever comes back.
- **Validating a connection** asks for a token with the client credentials each time,
  although RoomPriceGenie prefers the refresh grant. How often the engine validates, and
  whether RoomPriceGenie minds, is not known.
- **Property code of an access token.** If the access token is a JWT with an `aud` or
  `property_code` claim, a connection whose Property Code is not in it is refused. Whether
  access tokens carry these claims is documented only for the tokens RoomPriceGenie sends.
- **Reservations.** The documentation's example sends RoomPriceGenie's own account ID as
  `property_code` and the partner's ID as `partner_property_code`, while every other
  event uses the partner's code as `property_code`. The component sends the connection's
  Property Code as both unless the inputs say otherwise.
- **`tracking_id`.** A new UUID4 per request. When the engine retries a failed message,
  the retry gets a new one. Whether RoomPriceGenie removes duplicates by it is not
  documented.
- **Prices with decimals** are rounded to the closest whole number, as the documentation
  asks.
- **Rate limit.** Not published. The quota is 5 requests a second per user, a number of
  this connector.

### Updates from RoomPriceGenie

- **`X-API-Key` on incoming requests.** The examples show RoomPriceGenie sending the
  partner's key with every update; the endpoint requires it. If RoomPriceGenie does not
  send it, every update is answered 401.
- **`client_id` claim.** An update reaches only the flows of the connection whose Client ID
  equals the `client_id` claim of the token (documented as "the account's client_id, the
  same used for access token requests"). If the claim is missing or has another form,
  nothing is delivered and the answer is 404.
- **`aud` claim.** Must contain the `property_code` of the body, as the documentation
  suggests.
- **Signing keys.** Read from `GET {base}/integrations/jwk/` as `{ key: [...], info: [...] }`
  (the standard `keys` is accepted too). RSA keys under 2048 bits are ignored. The key size
  RoomPriceGenie uses is not documented.
- **Answer to a key rotation notice.** `200` with `{}`, as the example shows. The keys in
  the notice are not used; the key set is read again.
- **Answers on failure.** The documentation defines only the success answer. The endpoint
  answers 401 (credentials), 400 (body), 404 (no running flow for the property), 503
  (not configured, or signing keys unreachable). How RoomPriceGenie reacts, and whether
  it retries, is not documented. A retried update reaches the flows again; the tracking ID
  is in the trigger output.
- **Replay.** The token signs the sender, not the body, and is valid for 24 hours. Whoever
  holds a valid token and the Partner API Key can send any body for that property until it
  expires. This is how the vendor's scheme works; the connector cannot tighten it.
- **Configuration changes.** The endpoint reads the connector configuration that was
  loaded with the plugin. Whether a change in the Backoffice reaches it without a restart
  of the engine was not checked.
- **One message per room type and rate plan.** The endpoint splits an update into its
  `data` items. If delivery fails halfway, the answer is 500 and a retry delivers the
  first items twice.
- **Future events.** RoomPriceGenie announces a "Request Endpoint" (it asks the partner to
  resend data). It is not specified yet; the endpoint answers 400 to any event it does not
  know.
