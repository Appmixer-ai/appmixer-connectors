# Cliniko E2E test flows

Fifteen flows cover every action and every trigger in the connector.

| Flow | Covers |
|---|---|
| `test-flow-lists.json` | List Practitioners, List Businesses, List Appointment Types |
| `test-flow-patients.json` | Create / Get / Update / Find / Archive / Unarchive Patient |
| `test-flow-appointments.json` | Create / Get / Update / Find / Cancel Appointment (+ Get Next Available Time) |
| `test-flow-availability.json` | Find Available Times, Get Next Available Time |
| `test-flow-contacts.json` | Create Contact, Find Contacts |
| `test-flow-clinical.json` | Create Medical Alert, Create Treatment Note, Find Treatment Notes |
| `test-flow-make-api-call.json` | Make API Call |
| `test-flow-invoices.json` | Find Invoices |
| `test-flow-*-trigger.json` | New / Updated Patient, New / Updated / Cancelled Appointment, New Booking, New Invoice |

## Account prerequisites

The connected Cliniko account must have:

1. **An administrator-level API key.** The key inherits the permissions of the Cliniko
   user it belongs to; a receptionist-role key gets `403` on treatment notes and the
   clinical flow fails.
2. **Online bookings enabled** on the business, the practitioner and the appointment
   type, plus availability configured in the next seven days. Cliniko answers the
   availability endpoints with `404` when the resource is not published to online
   bookings, and the flows that book an appointment take their start time from
   `Get Next Available Time`. Affects `test-flow-availability.json`,
   `test-flow-appointments.json` and every appointment trigger flow.
3. **At least one invoice** for `test-flow-invoices.json` — see
   [Invoices cannot be created over the API](#invoices-cannot-be-created-over-the-api).

## Triggers poll, and the first tick is a baseline

Cliniko has **no webhooks** — every trigger polls. Two consequences shape the trigger
flows:

- The first tick after the flow starts only records a baseline and emits nothing, so
  the provoke lane opens with a `Wait 2m` before it creates anything. Without it the
  provoked record is swallowed by the baseline.
- A second tick then has to pick the record up, so the `AfterAll` timeout is 420 s.
  Give the runner a matching window.

Cleanup in the trigger flows consumes the **trigger's** output (`$.trigger.out.id`,
`$.trigger.out.patient_id`) rather than the provoke lane's — the two lanes are separate
message scopes, and using the trigger's ids makes the cleanup double as proof that the
trigger fired with usable data.

## Invoices cannot be created over the API

Every invoice path in the Cliniko API is **GET-only** (`/invoices`, `/invoices/{id}`,
`/invoice_items`, and the nested per-patient/per-appointment variants); `POST /invoices`
answers 404. Invoices can only be raised in the Cliniko UI. Two flows are shaped by that:

**`test-flow-invoices.json`** needs one invoice to already exist. Find Invoices routes an
empty result to `notFound`, so on an account with no invoices the `out` branch never
fires. Rather than let that hang, **both ports feed the same Assert**: the `notFound`
branch carries an assertion that fails on purpose with

> expected at least one invoice to equal none (this account has no invoices - create one
> in the Cliniko UI, the API cannot: every /invoices path is GET-only)

so the flow finishes in ~15 s with a readable failure and a recorded result, instead of
stalling until the AfterAll timeout with nothing in the store. Create a single invoice in
the Cliniko UI once and the flow goes green and stays green.

**`test-flow-newinvoice-trigger.json`** is a **manual harness, not an automated flow** —
exclude it from unattended sweeps. To exercise it:

1. Start the flow.
2. In the Cliniko UI, open a patient and raise an invoice.
3. The trigger lane asserts the invoice that arrives.

Its `AfterAll` timeout is 900 s to leave time for the manual step, and the provoke lane is
a bare `OnStart → Wait 10m` so the flow still satisfies the structural validators. Left
unattended it will always time out with no result — that is expected, not a regression.


## If a trigger flow reports a timeout, check the results store

`appmixer e2e run` used to decide a run had finished by looking for `ProcessE2EResults`
in the **newest 50 log entries**. A polling trigger keeps ticking and logging for as long
as the flow is up, so on the longest flows here (a seven-step provoke lane plus a
two-step cleanup) that entry scrolled out of the window and a passing run was reported
as a timeout. Both appointment trigger flows hit it on 2026-08-21 while landing in the
success store at 10:05:06 and 10:17:03.

Fixed in appmixer-cli — `waitForCompletion` now reads the whole run via `getRunLogs`
(Appmixer-ai/appmixer-cli#420); the same flow went from a 600 s timeout to
`PASSED` in 139 s. On a CLI without that fix, **`appmixer e2e results` is the
authority**: a `✓` with a timestamp inside the run window means the flow reached
ProcessE2EResults and every assertion held.

Independently of that, the runner has a hard 10-minute wall-clock kill
(`AGENT_TIMEOUT_MS`, default 600000 ms) that `--timeout` does not control. Passing
`--timeout 600` makes the two fire together and you lose the runner's own verdict —
leave the default (480 s), which is comfortably above what these flows need.

## Cleanup uses Archive, not Delete

Cliniko's `DELETE /patients/{id}` is deprecated and archives rather than deletes, so the
flows archive what they create. The `create-without-cleanup` validator only recognises
components named `Delete*`/`Remove*` and warns anyway — the warning is expected.
