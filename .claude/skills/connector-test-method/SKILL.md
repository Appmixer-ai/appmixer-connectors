---
name: connector-test-method
description: Add a test(context) method to an Appmixer trigger component so Flow Test Mode can emit one realistic, fetchable item. Use when a user wants to implement test(), make a trigger testable in the designer, or roll out Flow Test Mode support across triggers.
---

# Connector `test(context)` method

Adds a `test(context)` method to **trigger** components so the designer's Flow Test Mode
can produce a representative output **without** starting the flow and **without** waiting
for a real event.

## What `test()` is

When a flow is run in **Test Mode** with no explicit `payload`/`inputData`, the trigger's
`start()`/`stop()`/`tick()` are **skipped**. The engine resolves test data via a fallback chain:

1. the component's `test(context)` method — **this method**, called first
2. a search of recent run logs for an output from this component/flow
3. deterministic samples generated from the outPort JSON Schema
4. empty `receive()` / error

Steps 2–3 are weak: logs exist only after a production run, and schema samples produce
synthetic IDs (`"sample"`, `0`) that downstream API components reject on the first hop.
So `test()` is what makes Test Mode actually useful.

Key facts about how the engine calls it:
- The context is created from the component (with an **empty message**), so it carries the
  component's config — **`context.auth` and `context.properties` are fully available**.
- **`context.state` is empty** — the flow was never started, so no `tick()` has ever saved a
  cursor. `test()` must not rely on reading state (and must not write it, see Hard rules).
- `test()` runs inside a `try/catch`. If it **throws**, the error is logged and the chain
  falls through to the log/schema fallbacks. **Throw on "no example available" — never
  return null, send nothing, or fabricate fake data** (see Hard rule 5).

## Where `test()` lives

`test()` is just another exported method in the trigger's behavior file, next to
`tick()`/`receive()`. **No `component.json` change is needed** — the engine detects the method
automatically:

```javascript
'use strict';

module.exports = {

    async tick(context) { /* production polling logic */ },

    async test(context) { /* one read-only fetch + sendJson, see below */ }
};
```

## Core principle: `test()` and `tick()`/`receive()` must share code

This is the most important rule and the reason this skill exists. `test()` only has value if
its output is **byte-for-byte the same shape** as what the trigger emits in production. The way
to guarantee that — and to keep it true as the connector evolves — is to make `test()` and
`tick()`/`receive()` **call the same functions**, not re-implement the same logic side by side.

**Maximize shared code. `test()` should be a thin wrapper, not a parallel implementation.**

Factor the production path into helpers that both entry points reuse:
- **the upstream request** (URL, auth, headers, query building, pagination parsing), and
- **the record→output mapping** (`fields` object).

Ideally `test()` adds only: a different query (newest-first, single item), a "take the first
record" line, and a `throw` when empty. Everything else flows through the shared helpers.

❌ **Anti-pattern**: `test()` re-declares the base URL, auth config, query param logic and the
HTTP call, duplicating `tick()`. The two **will** drift — someone fixes a header or a mapped
field in `tick()` and forgets `test()`, and the test silently emits a stale/wrong shape.

✅ **Pattern:** one `requestX(context, query, opts)` helper does the fetch + map and returns
mapped records (+ next page); `tick()` loops/dedups/saves state around it, `test()` calls it
once with a newest-first query and emits `records[0]`.

Use the built-in **`context.httpRequest`** for the HTTP call (axios-compatible options/response:
`{ method, url, params, data, headers }` → `{ data, status, headers }`). It needs no extra
dependency in your connector's `package.json` and goes through the platform's HTTP stack.

```javascript
// shared by BOTH tick() and test() — request shape + mapping live in one place
async function requestTickets(context, urlOrParams, normalizedEmbed) {
    const { auth } = context;
    const url = typeof urlOrParams === 'string'
        ? urlOrParams
        : `https://${auth.domain}.example.com/api/v2/tickets?${urlOrParams.toString()}`;
    const credentials = Buffer.from(`${auth.apiKey}:X`).toString('base64');
    const res = await context.httpRequest({
        url, headers: { Authorization: `Basic ${credentials}` }
    });
    const records = (res.data || []).map(t => mapTicket(t, normalizedEmbed));
    const match = (res.headers.link || '').match(/<([^>]+)>;\s*rel="next"/);
    return { records, nextUrl: match ? match[1] : null };
}
```

If the connector already exposes a polling helper (`lib.listNewMessages`, etc.), reuse it
directly with empty state instead of writing a new request. Only extract a new helper when the
logic is inlined in `tick()`/`receive()`.

**SDK-based connectors.** Some connectors don't issue raw HTTP at all — they call a vendor SDK
(`asana`, `@slack/web-api`, `googleapis`, …) that builds the request *and* maps the response.
There's then no URL/auth/query/mapping to extract: **the SDK call itself is the shared seam.**
`test()` must call the **exact same SDK methods** `tick()`/`receive()` uses (e.g. the same
`list` + `findById` pair) so the emitted object is identical — the server does the mapping. The
only new code is usually a tiny "pick the newest record" selector. Don't wrap the SDK in a new
`context.httpRequest` helper just to satisfy the "share a helper" rule; reusing the same SDK
methods already satisfies it. See `src/appmixer/asana` (`asana-commons.pickLatest()` + each
trigger's `test()`).

## Hard rules

1. **Read-only against upstream.** Only `GET`/list. No `POST`/`PUT`/`PATCH`/`DELETE`, no
   `markAsRead`, `acknowledge`, `commit`, or anything that mutates remote state.
2. **No state writes — any scope.** Do NOT call `context.saveState`/`stateSet`/`stateUnset`/
   `stateClear`/`stateInc`/`stateAddToSet`/`stateRemoveFromSet`, nor the `context.flow.*` or
   `context.service.*` variants. Test Mode keeps the flow `stopped` and runs no shutdown
   cleanup, so any write leaks (component state lingers — worse for `"state": {"persistent": true}`
   triggers; service state leaks into other users' production runs). Use local variables for
   any dedup/cursor logic. When reusing a polling helper that takes state, pass `{ known: [] }`
   or `{ cursor: null }` so it returns the freshest item.
3. **Respect `context.properties`.** If the trigger filters (query, channelId, …), `test()`
   must return an item matching the same filters, or the test is misleading.
4. **Emit exactly one item** via `context.sendJson(item, '<port>')`, shaped **identically** to
   what `tick()`/`receive()` emits. Never use `sendArray`/`sendArrayOutput`.
5. **Throw, don't fabricate, when there's no real example.** Two cases: (a) the inbox/channel is
   empty right now, or (b) — more fundamental — the trigger is webhook-only and the upstream
   exposes **no API to fetch a representative sample** (e.g. WhatsApp received messages / status
   updates). In both, `throw new context.CancelError('<why + how to trigger it for real>')`.
   **Never hand-craft synthetic data** — fake IDs, phone numbers, `wamid.TEST…`, canned message
   bodies. It makes the test pass while testing nothing and emits data that matches no real run,
   which is worse than no `test()` at all. (Only exception: Group E timer triggers, whose payload
   is legitimately *computed* — real dates — not invented.)
6. **No quota abuse.** Reuse the same lib helpers `tick()` uses so the call goes through the
   same quota manager and rate limiter.

## Procedure

1. **Confirm it's a trigger.** `component.json` has `properties` (not `inPorts`) and the
   behavior file has `tick()` or `start()/receive()/stop()`. Actions are out of scope (they
   are tested via `inputData` → `receive()`).
2. **Find the outPort name** in `component.json` `outPorts[].name` (e.g. freshdesk → `ticket`,
   slack → `message`). `sendJson` must use this exact name.
3. **Refactor the production path into shared helpers FIRST** (see Core principle). Read
   `tick()`/`receive()` and pull out (a) the upstream **request** (URL/auth/query/pagination)
   and (b) the record→`fields` **mapping** into functions, then make `tick()`/`receive()` call
   them. Do this even if it means touching working code — the shared seam is the whole point.
   If a connector polling helper already exists, skip this and reuse it.
4. **Verify `tick()`/`receive()` still behaves identically** after the refactor (lint + the
   existing tests/E2E). `test()` is worthless if the refactor changed production output.
5. **Write `async test(context)` as a thin wrapper:** resolve properties with the same helper,
   call the shared request with a **newest-first, single-item** query (`per_page=1`/`limit=1`,
   `order_by=<created>` `desc`) honoring `context.properties` filters, then `sendJson(records[0],
   '<port>')`. **No cursor, no `saveState`.** `throw` if empty.
   - **Branching triggers.** If `tick()`/`receive()` takes a different code path depending on a
     property (e.g. `TaskCompleted`: a single-item lookup when `task` is set vs a project-wide
     scan when it isn't), `test()` must **mirror the same branch selection** so its output
     matches whichever path production would take for that config — don't collapse the branches
     into one.
6. **Verify** (see "Verifying your test() method" below): run lint/validate, then invoke
   `test()` either via the CLI `--test` flag or via Flow Test Mode on a live instance.

## Verifying your `test()` method

Always run the static checks first:

```bash
npm run lint
npm run validate
```

Then verify the method actually emits a realistic item. Two options:

**Option 1 — Appmixer CLI** (requires a CLI version that supports the `--test` flag; check with
`appmixer test component --help`):

```bash
# one-time: store auth credentials for the connector
appmixer test auth login ./src/appmixer/<connector>/auth.js

# invoke test() directly (skips start/stop/tick/receive, exactly like Flow Test Mode)
appmixer test component ./src/appmixer/<connector>/<path-to-trigger> --test
```

Without stored auth data the CLI fails before `test()` is even called.

**Option 2 — live instance** (works with any CLI version): pack & publish the connector
(`appmixer pack` + `appmixer publish`), build a small flow with the trigger connected to a
downstream component, and run **Test** in the designer without starting the flow. The trigger's
output in the test run should show a real, fetchable item (not `"sample"` / `0` placeholders —
those mean the engine fell back to schema samples because `test()` threw or is missing).

## Trigger groups

| Group | Description | `test()` approach |
|-------|-------------|-------------------|
| **A** Polling list+dedup | `tick()` lists latest, dedups vs state (e.g. `freshdesk.NewTicket`, `gmail.NewEmail`, `github.NewIssue`, `wordpress.*`, `asana.*`) | Reuse the same fetch+map path, queried newest-first (`desc` + `limit 1`), emit first item. ⚠️ If the polling helper has a baseline/init phase that suppresses first-run output (e.g. gmail), don't call it with empty state — add a small `fetchLatest` helper that shares the mapping. For SDK-based connectors (`asana`) reuse the same SDK `list`+`findById` calls — the SDK is the shared seam (see "SDK-based connectors" above). |
| **B** Per-flow webhook | `start()` registers a per-flow webhook (e.g. `calendly`, `shopify`, `xero`, `hubspot`, `microsoft.mail`) | Do NOT register. Add a shared `lib.fetchLatestExample(context, type, properties)` once per connector, fetch newest record via REST, reshape into the webhook payload. |
| **C** Plugin-based (global URL + `addListener`) | app-level webhook, `plugin.js`/`routes.js` fan out (e.g. `slack`, `whatsapp`, `meta.*`) | Skip `addListener`, fetch one recent matching event via REST, return it in the exact shape `routes.js` puts on the wire. **If the upstream has no API to fetch such an event** (e.g. WhatsApp received messages / message-status updates), do NOT fabricate one — `throw new context.CancelError(...)` explaining it can only be triggered by a real event (see Hard rule 5). |
| **D** Generic webhook (`utils.http.Webhook*`) | no schema/upstream | **Do not implement.** Rely on log search or user-provided `payload`; document in the description. |
| **E** Scheduler/timer (`utils.timers.SchedulerTrigger`) | no external API | Return a synthetic well-formed payload (current/next dates). |
| **F** Form (`utils.forms.FormTrigger`) | dynamic schema from `properties.fields.ADD` | Walk fields, synthesize a plausible value per `field.type`. |

### Group A example (canonical — `freshdesk.NewTicket`)

The shared pieces live in the connector's `lib.js` so every component issues requests the same
way: `apiCall()` (auth + base URL on top of `context.httpRequest`), `mapTicket()` (raw ticket →
output `fields`) and `requestTickets()` (one page: fetch + map + pagination parsing). `tick()`
and `test()` both go through `requestTickets()`; `test()` adds only the newest-first query and
`records[0]`. See `src/appmixer/freshdesk/lib.js` + `tickets/NewTicket/NewTicket.js`.

```javascript
// lib.js — single source of truth for request shape, mapping and pagination
async function apiCall(context, { method = 'GET', url, params, data, headers = {} } = {}) {
    const baseUrl = `https://${context.auth.domain}.freshdesk.com/api/v2`;
    const credentials = Buffer.from(`${context.auth.apiKey}:X`).toString('base64');
    return context.httpRequest({
        method,
        url: /^https?:\/\//.test(url) ? url : `${baseUrl}${url}`,
        headers: { Authorization: `Basic ${credentials}`, ...headers },
        params, data
    });
}

async function requestTickets(context, urlOrParams, normalizedEmbed = []) {
    const url = typeof urlOrParams === 'string' ? urlOrParams : `/tickets?${urlOrParams.toString()}`;
    const res = await apiCall(context, { url });
    const records = (res.data || []).map(ticket => mapTicket(ticket, normalizedEmbed));
    const match = (res.headers.link || '').match(/<([^>]+)>;\s*rel="next"/);
    return { records, nextUrl: match ? match[1] : null };
}

// NewTicket.js
async test(context) {
    const normalizedEmbed = getNormalizedEmbed(context);

    const params = new URLSearchParams({
        order_by: 'created_at', order_type: 'desc', per_page: '1'
    });
    if (normalizedEmbed.length > 0) {
        params.set('include', normalizedEmbed.join(','));
    }

    const { records } = await requestTickets(context, params, normalizedEmbed);
    if (!records.length) {
        throw new Error('No recent tickets to use as test data.');
    }
    return context.sendJson(records[0], 'ticket');
}
```

### Group B example (`calendly.events.InviteeCreated`)

The production `receive()` just forwards the webhook body, so there's no fetch+map to share with
it — instead the reuse is **across the connector's webhook triggers**. Add `fetchLatestExample()`
+ `toWebhookShape()` to the connector commons once; each trigger's `test()` is a thin wrapper.
See `src/appmixer/calendly/calendly-commons.js` + `events/InviteeCreated/InviteeCreated.js`.

```javascript
// calendly-commons.js — shared by every Calendly webhook trigger's test()
async fetchLatestExample(context) {
    const { accessToken, profileInfo: { resource } } = context.auth;
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    const events = await context.httpRequest({
        method: 'GET', url: 'https://api.calendly.com/scheduled_events', headers,
        params: { user: resource.uri, sort: 'start_time:desc', count: 1 }
    });
    const event = (events.data.collection || [])[0];
    if (!event) return null;
    const invitees = await context.httpRequest({
        method: 'GET', url: `${event.uri}/invitees`, headers, params: { count: 1 }
    });
    return (invitees.data.collection || [])[0] || null;
}
// toWebhookShape(context, invitee, 'invitee.created') -> the exact body the webhook delivers

// InviteeCreated.js
async test(context) {
    const invitee = await commons.fetchLatestExample(context);
    if (!invitee) throw new Error('No recent invitees to use as test data.');
    return context.sendJson(commons.toWebhookShape(context, invitee, 'invitee.created'), 'out');
}
```

### Group C example (`slack.list.NewChannelMessageRT`)

Plugin trigger: events normally arrive via `context.addListener`. `test()` skips that and reuses
the **same `conversations.history` call the polling `slack.list.NewChannelMessage` trigger uses**,
honoring the same `ignoreBotMessages` filter as `receive()`.
See `src/appmixer/slack/list/NewChannelMessageRT/NewChannelMessageRT.js`.

```javascript
const { WebClient } = require('@slack/web-api');
const Entities = require('html-entities').AllHtmlEntities;

async test(context) {
    const { channelId, ignoreBotMessages } = context.properties;
    const web = new WebClient(context.auth.accessToken);
    const { messages } = await web.conversations.history({ channel: channelId, limit: 1 });
    const sample = (messages || [])[0];
    if (!sample) throw new Error('No recent messages in the channel to use as test data.');
    if (ignoreBotMessages && sample.subtype === 'bot_message') {
        throw new Error('The most recent message is a bot message.');
    }
    sample.text = new Entities().decode(sample.text);
    return context.sendJson(sample, 'message');
}
```

### Group E example (`utils.timers.SchedulerTrigger`)

No external API — `test()` returns a synthetic but well-formed payload. The key is still code
sharing: the schedule computation (`getNextRun()`) is the same function `start()`/`receive()`
use, so the emitted dates respect the user's configured schedule, timezone and end date.
See `src/appmixer/utils/timers/SchedulerTrigger/SchedulerTrigger.js`.

```javascript
async test(context) {
    const { timezone = 'GMT' } = context.properties;
    if (timezone && !isValidTimezone(timezone)) {
        throw new context.CancelError('Invalid timezone');
    }

    const now = moment().toISOString();
    // Same computation start()/receive() use — no timeout set, no state touched.
    const nextDate = this.getNextRun(context, { now, previousDate: null, firstTime: true });
    if (!nextDate) {
        throw new Error('No next run within the configured schedule (end date reached).');
    }

    return context.sendJson({
        previousDate: null,
        nextDateGMT: nextDate.toISOString(),
        nextDateLocal: moment(nextDate).tz(timezone).format('YYYY-MM-DDTHH:mm:ss.SSS'),
        timezone
    }, 'out');
}
```

### Group F example (`utils.forms.FormTrigger`)

The output schema is dynamic (defined by `context.properties.fields.ADD`), so `test()` walks the
configured fields and synthesizes a plausible value per `field.type`. Match what a real
submission produces: HTML forms submit **strings** (only checkbox is normalized to a boolean by
`receive()`), and prefer the field's configured `defaultValue` for realism.
See `src/appmixer/utils/forms/FormTrigger/FormTrigger.js`.

```javascript
test(context) {
    const fields = (context.properties.fields && context.properties.fields.ADD) || [];
    if (!fields.length) {
        throw new Error('No form fields defined.');
    }

    const entry = {};
    fields.forEach((field, index) => {
        const name = 'field_' + index;
        if (field.type === 'checkbox') {
            entry[name] = true;
            return;
        }
        if (field.defaultValue) {
            entry[name] = field.defaultValue;
            return;
        }
        switch (field.type) {
            case 'number': entry[name] = '42'; break;
            case 'date': entry[name] = '2026-01-01'; break;
            case 'email': entry[name] = 'user@example.com'; break;
            case 'color': entry[name] = '#336699'; break;
            case 'password': entry[name] = 'secret'; break;
            default: entry[name] = field.label || 'Sample text';
        }
    });

    return context.sendJson(entry, 'entry');
}
```

## Per-trigger checklist

- [ ] **`test()` shares the request + mapping path with `tick()`/`receive()`** — no duplicated
      URL/auth/query/mapping. `test()` is a thin wrapper; the production path was refactored into
      shared helpers and still behaves identically.
- [ ] No state writes (component / flow / service), no upstream mutations
- [ ] Honors `context.properties` filters
- [ ] Emits exactly one item, shape matches `tick()`/`receive()` exactly, correct port name
- [ ] Throws (not returns null) when no example exists
- [ ] `npm run lint` + `npm run validate` pass, and `test()` verified via CLI `--test` or
      Flow Test Mode on a live instance (see "Verifying your test() method")

## Reference connectors

Worked examples across the groups:

**Group A — polling list+dedup:**
- **`freshdesk.NewTicket`** (`src/appmixer/freshdesk/tickets/NewTicket/`) — *extract from inlined
  logic.* `tick()` had the request + mapping inlined, so they were pulled into `lib.requestTickets()`
  + `lib.mapTicket()` and now `tick()` and `test()` both call them. Also has **dynamic** outPorts
  (via `GenerateTicketsOutput`), so the schema fallback is weak and `test()` carries real value.
  The sibling triggers `UpdatedTicket` (cursor on `updated_at`) and `DeletedTicket`
  (`filter=deleted`, own mapping) follow the same shape; `NewConversation` shares
  fetch/filter/emit helpers between `tick()` and `test()`.
- **`google.gmail.NewEmail`** (`src/appmixer/google/gmail/NewEmail/` + `../lib.js`) — *reuse an
  existing lib helper.* The per-message fetch+normalize was factored into `lib.fetchMessage()`
  (reused by both `listNewMessages()` and a new `lib.fetchLatestExample()`); `test()` is a 4-line
  wrapper. Note the gotcha: `listNewMessages()` suppresses output on first run (baseline-only
  init phase), so `test()` could **not** just call it with empty state — it needed the dedicated
  `fetchLatestExample()` that lists newest-first and honors `query`. Watch for this whenever the
  polling helper has init/baseline semantics.
- **`asana.*`** (`src/appmixer/asana/` — `NewTask`, `NewSubtask`, `NewStory`, `NewComment`,
  `NewTag`, `TagAdded`, `TaskCompleted`, `NewProject`, `NewTeam`) — *SDK-based, no HTTP helper.*
  Every `tick()` lists via the `asana` SDK, dedups vs state, then re-fetches each hit with
  `<resource>.findById(gid)` and emits that. `test()` calls the **same** list + `findById`, so
  the shape is identical; the one shared addition is `asana-commons.pickLatest()` (newest by
  `created_at`/`gid`). `NewComment` keeps the `type === 'comment'` filter; `TagAdded` reads the
  task's `tags`; `TaskCompleted` mirrors both of `tick()`'s branches (single `task` vs
  project-wide scan) — a worked example of the branching-trigger rule.

**Group B — per-flow webhook:**
- **`calendly.events.InviteeCreated`** (`src/appmixer/calendly/events/InviteeCreated/` +
  `../../calendly-commons.js`) — `receive()` only forwards the webhook body, so the reuse is
  *across the connector's webhook triggers*: `fetchLatestExample()` (REST, newest invitee) +
  `toWebhookShape()` live in commons; `test()` is a thin wrapper that reshapes the REST record
  into the exact body the webhook delivers.

**Group C — plugin-based (global URL + `addListener`):**
- **`slack.list.NewChannelMessageRT`** (`src/appmixer/slack/list/NewChannelMessageRT/`) — `test()`
  skips `addListener` and reuses the same `conversations.history` call the polling
  `slack.list.NewChannelMessage` trigger uses, honoring the same `ignoreBotMessages` filter as
  `receive()`.

**Group E — scheduler/timer:**
- **`utils.timers.SchedulerTrigger`** (`src/appmixer/utils/timers/SchedulerTrigger/`) — `test()`
  reuses the same `getNextRun()` computation as `start()`/`receive()` and emits the next-run
  payload without setting any timeout or touching state.

**Group F — form (dynamic schema):**
- **`utils.forms.FormTrigger`** (`src/appmixer/utils/forms/FormTrigger/`) — `test()` synthesizes
  one entry from `properties.fields.ADD`, matching the exact shape a real POST submission
  produces (`field_<index>` keys, string values, checkbox → boolean, `defaultValue` preferred).
