# Nuki E2E test flows

**None of these flows has been run.** They pass `appmixer e2e validate`, and that is all.
Nuki has no sandbox and no virtual device, so a run needs a real Nuki device. The test
account (`creds show nuki`) has a token but no device. Treat the flows as prepared, not as
proof.

## Verified live without a device (2026-11-27)

With a real API token on an account that has no device:

- `appmixer test auth validate`: `true`. `requestProfileInfo` labels the account with its
  e-mail (`GET /account`).
- Create Account User, Find Account Users (first / array, the `email` filter, an unknown
  e-mail goes to `notFound`) and Delete Account User, on a user created for the run and
  deleted again. Deleting it a second time ends with the 404 message.
- `appmixer connector verify nuki`: 0 failures. Find Account Users matches its schema; the
  optional `type` and `operationId` (both in Nuki's Swagger) were not returned for that
  user. Its shape is in `artifacts/samples/`. The device components were skipped: no device.
- Find Smartlocks, Find Log Entries and Find Smartlock Authorizations on the empty account,
  and on a device ID that does not exist, go to `notFound` (Nuki answers `200 []`).
- Get Smartlock, Lock Smartlock and the Smartlock State Changed trigger on a device ID that
  does not exist end with the 403 message. Nuki answers 403 "Your account forbids the
  execution", not 404, for a device outside the account.
- Make API Call with a relative path and with a full `https://api.nuki.io` URL; a foreign
  host is refused before any request.
- New Log Entry: `test()` ends with "No log entry matches the trigger settings yet";
  `tick()` records an empty baseline.
- The lock and unlock endpoints accept a POST without a body whatever the Content-Type.
  `POST /smartlock/{id}/action/lock` with the body `{}` answers 415, so the connector
  must keep sending no body there (it does).

Not settled: everything under "Things only a run can settle" below, since each needs a
device.

## What a run needs

- A Nuki Web account (https://web.nuki.io) with the API activated. A Google sign-in works
  (the test account uses one).
- One Nuki Smart Lock connected to that account and online: a model with built-in Wi-Fi,
  or an older model with a Nuki Bridge. It does not have to be mounted on a door, but it
  must be set up in the Nuki app.
- A Nuki Keypad paired with that lock, for `test-flow-keypad-code.json`.
- If the account is used for short-term rental, an active Smart Hosting subscription on
  the lock. Without it Nuki answers the create requests with 402.
- An API token created in Nuki Web under API, with the rights View devices
  (`smartlock.readOnly`), Operate devices (`smartlock.action`), View and manage
  authorizations (`smartlock.auth`) and View activity logs (`smartlock.log`). Add View and
  manage account (`account`) to see the account's e-mail address as the connection name.
  The test account's token has all of them.

## The flows

### test-flow-smartlocks.json

- Covers Find Smartlocks, Get Smartlock, Find Log Entries, Make API Call.
- Read-only. The device needs at least one activity log entry.

### test-flow-keypad-code.json

- Covers Create Keypad Code, Get / Update / Find / Delete Smartlock Authorization.
- Creates a code valid for one day with a generated code, extends it, finds it by name,
  deletes it.
- Create Keypad Code waits until Nuki Web lists the code (up to 5 minutes).

### test-flow-app-invite.json

- Covers Create Account User, Find Account Users, Create App Invite, Delete Account User
  (and Delete Smartlock Authorization for cleanup).
- Nuki e-mails an invitation to `test+nuki-e2e@appmixer.ai` on every run.

### test-flow-trigger-new-log-entry.json

- Covers the New Log Entry trigger and Run Smartlock Action.
- **Physically locks the device.**

### test-flow-trigger-state-changed.json

- Covers the Smartlock State Changed trigger, Unlock Smartlock and Lock Smartlock.
- **Physically unlocks the device and locks it again two minutes later.**

## Things only a run can settle

These are assumptions taken from the Nuki documentation and the Swagger file. The first
run should check each of them.

- **Does a new authorization appear in `GET /smartlock/{id}/auth` right away, or only once
  the device has stored it?** Create Keypad Code and Create App Invite find the ID of the
  new authorization there. If an app invitation is listed only after the guest accepts
  it, Create App Invite will always end on its `notConfirmed` port and needs another way
  to return the ID.
- **Does `POST /smartlock/{id}/auth/{authId}` keep the fields that are left out?** Update
  Smartlock Authorization sends the current values back together with the change, so it
  is right either way, but resending `allowedFromTime` / `allowedUntilTime` / `allowedWeekDays`
  as read has not been tried.
- **Does the API accept `type` and `code` as integers?** The Swagger file types them as
  integers, the guide's example sends strings. The connector sends integers.
- **Is the activity log returned newest first?** The API has no sort parameter. The New
  Log Entry trigger and Find Log Entries rely on newest first.
- **Which time zone do `allowedFromTime` / `allowedUntilTime` use?** The guide says
  "minutes from midnight" and does not name the zone.
- **Does a lock command on an already locked device write a log entry?** The New Log Entry
  flow assumes it does.
- **The `started` value of On Start** is appended to the authorization name; the name
  may have at most 32 characters.
