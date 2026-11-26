# SiteMinder E2E test flows

**No request of this connector has ever reached SiteMinder, and SiteMinder has never sent it
a reservation.** SiteMinder Exchange (SMX) is open only to partners with a signed agreement,
and no test account existed when the connector was built.

What has run is the reservation half against SiteMinder's own sample messages: the flow
`test-flow-reservation-triggers.json` posts them to the connector's reservation endpoint on a
live Appmixer instance. That tests Appmixer's side of the exchange. It says nothing about what
a real publisher sends.

The two flows of the availability and rates API pass `appmixer e2e validate`, and that is
all. Treat them as prepared, not as proof.

## The flows

### test-flow-reservation-triggers.json

- Covers the four triggers (New Reservation Message, New Reservation, Updated Reservation,
  Cancelled Reservation) and the answers of the reservation endpoint.
- **Self-provoked, needs no SiteMinder account.** Five `Post` components send the documented
  sample messages to `/plugins/appmixer/siteminder/reservations` of the instance the flow
  runs on: minimum content (new), maximum content (modified), minimum cancellation, then the
  minimum content message with a wrong password (OTA error 497) and with a hotel code no
  flow listens for (OTA error 392).
- Ran on dev-automated-00001 on 2026-11-26: passed, 9 asserts with 38 checks.
- Needs a SiteMinder connection with exactly these values, because the messages in the flow
  carry them:
    - Environment: Pre-production
    - API Token: empty
    - Endpoint Username: `appmixer-e2e-sample`
    - Endpoint Password: `E2e-Sample-0nly!2026`
- These credentials are public sample values. Anybody can post a reservation with them
  while the flow runs. Never use them for a connection that receives real reservations.
- The messages are SiteMinder's samples with only the username and password replaced (and
  the hotel code in the last one), so their dates are from 2017 and 2018. The flow validator
  warns about hardcoded dates; nothing in the flow depends on the current date.
- Not covered here, covered by unit tests: malformed XML and XML with a DOCTYPE (the
  endpoint answers HTTP 500 with a SOAP fault, which would stop the flow at the `Post`),
  and a request posted straight to a trigger's webhook URL.

### test-flow-hotel-content.json

- Covers Find Publishers, Find Hotels, Find Room Types, Get Room Type, Find Rate Plans and
  Get Rate Plan.
- Read-only. **Never run.**

### test-flow-availability-rates.json

- Covers Find Room Type Availability, Find Rate Plan Availability, Find Rates and Make API
  Call (and uses Find Publishers, Find Hotels, Find Room Types and Find Rate Plans to get
  the codes).
- Read-only, 30 days from today. **Never run.**

## What a run of the two API flows needs

- A partnership agreement with SiteMinder for SiteMinder Exchange, and the test environment
  SiteMinder issues during onboarding.
- The Bearer token generated in the SMX Partner Portal of that environment.
- A SiteMinder connection on the test instance with Environment "Pre-production" and that
  token. Store the token with `creds set siteminder ...` in appmixer-test-credentials.
- A test hotel whose publisher provides availability and rates. The hotel SiteMinder sets
  up for certification is a Little Hotelier account, and Little Hotelier and SiteMinder
  Channel Manager provide reservations only. With such a hotel the room type, rate plan,
  availability and rates steps answer HTTP 405.
- The flows take the first publisher and its first hotel. If the account has several, the
  first one must be the hotel with availability and rates.

To test reservations with SiteMinder itself, SiteMinder also needs the endpoint URL
`<API URL of the instance>/plugins/appmixer/siteminder/reservations`, an endpoint username
and password of your choice (not the sample ones above) and the hotel code of the test
hotel. A flow with a reservation trigger for that hotel code must be running; reservations
are then created in the test hotel's Little Hotelier account by hand.

## Things only a run can settle

These are assumptions taken from the documentation and the OpenAPI file.

### Reservations

- **New or updated.** SiteMinder sends the whole reservation after every change and has no
  flag for a new one. New Reservation and Updated Reservation decide by the last-modified
  time: none, or one equal to the creation time, means new. This follows the "Commit" and
  "Modify" samples of the reference. Whether every publisher fills `LastModifyDateTime`
  this way is unknown. New Reservation Message does not depend on it.
- **Which reservation ID SiteMinder expects in the answer.** The answer returns the received
  `UniqueID` as `ResID_Value` with `ResID_Type="10"`, which the SMX FAQ allows for
  applications that create no ID of their own.
- **HTTP status of a SOAP fault.** Unreadable XML is answered with a SOAP fault and HTTP 500
  (SOAP 1.1). The documentation shows the fault without naming the status.
- **Retries.** After a failed delivery SiteMinder sends the message again, up to 3 times.
  Whether a retry keeps its `EchoToken` is not documented. The connector does not remove
  duplicates: a retry after an answer that got lost reaches the flow twice. The echo token
  is in the trigger output.
- **Certification.** SiteMinder's test scenarios (all statuses, minimum and maximum
  content, the modify and cancel lifecycles, services, special characters, both error
  cases) have unit tests built from the documented samples, not from messages of a
  publisher.
- **Namespaces and prefixes.** The parser ignores namespace prefixes, so any prefix a
  publisher uses for the SOAP and WS-Security elements is read.

### Availability and rates

- **Base URLs.** `https://exchange-api.siteminder.com/inventory/v1` (production) and
  `https://tpi-subscriberx.preprod.siteminderlabs.com/inventory/v1` (pre-production) are
  taken from the documentation. No request was sent to either.
- **Token lifetime.** Not documented. A 401 marks the connection as invalid.
- **Fields.** The output schemas follow the OpenAPI file, including which fields are
  required. `appmixer connector verify siteminder` compares them with real answers.
- **Error bodies.** Messages are read from `{ name, message }`, `{ code, message }` and
  `{ errors: [...] }`, the three shapes in the OpenAPI file.
- **Rate limit.** Not published. The quota is 30 requests a minute per account, the number
  SiteMinder's certification guide asks for per property.
- **Write endpoints.** `POST` and `PUT .../rates`, `PUT .../availability` and
  `GET .../messages/{messageId}` are in the OpenAPI file only. No component uses them.
