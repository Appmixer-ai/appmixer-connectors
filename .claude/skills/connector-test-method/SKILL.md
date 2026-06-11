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
- `test()` runs inside a `try/catch`. If it **throws**, the error is logged and the chain
  falls through to the log/schema fallbacks. **Throw on "no example available" — never
  return null or send nothing.**

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

❌ **Anti-pattern** (current risk): `test()` re-declares the base URL, auth config, `include`
param logic and the axios call, duplicating `tick()`. The two **will** drift — someone fixes a
header or a mapped field in `tick()` and forgets `test()`, and the test silently emits a
stale/wrong shape.

✅ **Pattern:** one `requestX(context, query, opts)` helper does the fetch + map and returns
mapped records (+ next page); `tick()` loops/dedups/saves state around it, `test()` calls it
once with a newest-first query and emits `records[0]`.

```javascript
// shared by BOTH tick() and test() — request shape + mapping live in one place
async function requestTickets(context, urlOrParams, normalizedEmbed) {
    const { auth } = context;
    const url = typeof urlOrParams === 'string'
        ? urlOrParams
        : `https://${auth.domain}.freshdesk.com/api/v2/tickets?${urlOrParams.toString()}`;
    const res = await axios.get(url, { auth: { username: auth.apiKey, password: 'X' } });
    const records = (res.data || []).map(t => mapTicket(t, normalizedEmbed));
    const match = (res.headers.link || '').match(/<([^>]+)>;\s*rel="next"/);
    return { records, nextUrl: match ? match[1] : null };
}
```

If the connector already exposes a polling helper (`lib.listNewMessages`, etc.), reuse it
directly with empty state instead of writing a new request. Only extract a new helper when the
logic is inlined in `tick()`/`receive()`.

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
5. **Throw on no example** (empty inbox, new channel) so the fallback chain takes over.
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
6. **Verify:** `appmixer test component ./src/appmixer/<connector>/core/<Component> --test`
   (the `--test` flag invokes `test()` directly), then `npm run lint` and `npm run validate`.

## Trigger groups

| Group | Description | `test()` approach |
|-------|-------------|-------------------|
| **A** Polling list+dedup | `tick()` lists latest, dedups vs state (e.g. `freshdesk.NewTicket`, `gmail.NewEmail`, `github.NewIssue`, `wordpress.*`) | Reuse the same fetch+map path, queried newest-first (`desc` + `limit 1`), emit first item. ⚠️ If the polling helper has a baseline/init phase that suppresses first-run output (e.g. gmail), don't call it with empty state — add a small `fetchLatest` helper that shares the mapping. |
| **B** Per-flow webhook | `start()` registers a per-flow webhook (e.g. `calendly`, `shopify`, `xero`, `hubspot`, `microsoft.mail`) | Do NOT register. Add a shared `lib.fetchLatestExample(context, type, properties)` once per connector, fetch newest record via REST, reshape into the webhook payload. |
| **C** Plugin-based (global URL + `addListener`) | app-level webhook, `plugin.js`/`routes.js` fan out (e.g. `slack`, `whatsapp`, `meta.*`) | Skip `addListener`, fetch one recent matching event via REST, return it in the exact shape `routes.js` puts on the wire. |
| **D** Generic webhook (`utils.http.Webhook*`) | no schema/upstream | **Do not implement.** Rely on log search or user-provided `payload`; document in the description. |
| **E** Scheduler/timer (`utils.timers.SchedulerTrigger`) | no external API | Return a synthetic well-formed payload (current/next dates). |
| **F** Form (`utils.forms.FormTrigger`) | dynamic schema from `properties.fields.ADD` | Walk fields, synthesize a plausible value per `field.type`. |

### Group A example (canonical — `freshdesk.NewTicket`)

Note how `tick()` and `test()` both go through `getNormalizedEmbed()` + `requestTickets()`
(which itself calls `mapTicket()`). `test()` adds only the newest-first query and `records[0]`.
See `src/appmixer/freshdesk/tickets/NewTicket/NewTicket.js` for the full file.

```javascript
function getNormalizedEmbed(context) {
    const { embed } = context.properties;
    return embed ? normalizeMultiselectInput(embed, context, 'Embed fields') : [];
}

// Shared request + mapping + pagination — the single source of truth for output shape.
async function requestTickets(context, urlOrParams, normalizedEmbed) {
    const { auth } = context;
    const url = typeof urlOrParams === 'string'
        ? urlOrParams
        : `https://${auth.domain}.freshdesk.com/api/v2/tickets?${urlOrParams.toString()}`;
    const res = await axios.get(url, { auth: { username: auth.apiKey, password: 'X' } });
    const records = (res.data || []).map(t => mapTicket(t, normalizedEmbed));
    const match = (res.headers.link || '').match(/<([^>]+)>;\s*rel="next"/);
    return { records, nextUrl: match ? match[1] : null };
}

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

## Per-trigger checklist

- [ ] **`test()` shares the request + mapping path with `tick()`/`receive()`** — no duplicated
      URL/auth/query/mapping. `test()` is a thin wrapper; the production path was refactored into
      shared helpers and still behaves identically.
- [ ] No state writes (component / flow / service), no upstream mutations
- [ ] Honors `context.properties` filters
- [ ] Emits exactly one item, shape matches `tick()`/`receive()` exactly, correct port name
- [ ] Throws (not returns null) when no example exists
- [ ] `appmixer test component …`, `npm run lint`, `npm run validate` all pass

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
