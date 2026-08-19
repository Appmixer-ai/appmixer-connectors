# Connector Review: hubbi

**Review Date:** 2026-08-11 (re-review; supersedes the 2026-07-16 pass)
**Reviewer:** Claude AI
**Branch:** feature/hubbi
**Bundle version:** 2.0.0

## Summary

| Category | Status | Issues Found |
|----------|--------|--------------|
| Structural | PASS | 1 (warning) |
| Component Types | PASS | 2 (suggestions) |
| Label Consistency | PASS | 3 (minor) |
| Code Quality | PASS | 5 (1 warning, 4 suggestions) |

**No blocking issues.** The two critical findings of the previous pass (changelog order, missing
`webhookUrl` in the properties schema) are fixed and confirmed gone from `npm run validate`.

At review time hubbi reported 5 non-blocking validator findings. **Four were fixed in this pass**
(see *Fixes Applied* below); only `connector-has-makeapicall` remains.

Verification after the fixes:

- `node scripts/validate.js --connector hubbi` (strict, thresholds ignored) — **8 failures**:
  `connector-has-makeapicall`, `no-select-with-source` x4, `dynamic-outport-required-inputs` x3.
  See *Strict validator findings* below. (Repo-wide `npm run validate` reports only the first of
  these — it runs in threshold/ratchet mode, which hid the other 7. An earlier draft of this
  report claimed the connector was clean apart from MakeApiCall on that basis; that was wrong.)
- `npx mocha --recursive --exit "test/hubbi/**/*.test.js"` — **87 passing**, 0 failing (was 75).
- `npx eslint src/appmixer/hubbi` — 0 findings other than `linebreak-style`, which comes from
  `core.autocrlf=true` on this Windows checkout. (`test/hubbi/*.test.js` additionally reports
  pre-existing `space-before-function-paren` on the mocha `function ()` style, in files this pass
  did not touch as well.)

## Fixes Applied (2026-08-11)

| # | Fix | Files |
|---|-----|-------|
| N1 | Isolated the SourceFields lookup in `try/catch` + `context.log` so a failed lookup no longer blanks the inspector | `core/StartHubWithData/StartHubWithData.js` |
| V1 | Added `example` values to the StartHub / StartHubWithData output port schemas | `core/StartHub/component.json`, `core/StartHubWithData/component.json` |
| V2 | Added `test(context)` to NewHubEvent for Flow Test Mode, plus a shared `fetchTargetFields()` helper | `core/NewHubEvent/NewHubEvent.js` |
| S3 | Shared one `listTargetHubs()` request between `requestProfileInfo` and `validate`, with a readable error on blank fields | `auth.js` |
| S4 | Defaulted `{ label = 'Records', value = 'result' }` in `getOutputPortOptions` | `lib.js` |
| — | Regression cover: 12 new cases (inspector fault tolerance, auth guards, `test()` across all three output types incl. shape parity with `receive()`) | `test/hubbi/StartHubWithData.test.js`, `test/hubbi/auth.test.js`, `test/hubbi/NewHubEvent.test.js` |
| — | Recorded all of the above in the unreleased 2.0.0 changelog | `bundle.json` |

**Not applied** (not selected): W4 (`version` in service.json), the `count` label alignment, the
NewHubEvent outputType option wording, S1, S2, S5, S6, and V3 (MakeApiCall).

### Note on the `test()` implementation

Hubbi has no endpoint for reading past hub events, so `test()` cannot fetch a real record. Instead
it loads the selected hub's **target field definitions** — through `fetchTargetFields()`, the same
helper `generateOutputPortOptions()` now uses — and synthesizes one value per mapped field type
(fixed values, so a test run is reproducible).

The first implementation emitted through `lib.sendArrayOutput` with a single record, which
guarantees shape parity by construction. The repo validator rejects that
(`[trigger-test-method] test() must emit a single item with sendJson, not sendArray/sendArrayOutput`),
so the payload is now built directly and passed to `context.sendJson`. Parity is instead pinned by a
test that runs `test()` and `receive()` over the same record and asserts the two emissions are
deep-equal — if `lib.sendArrayOutput`'s shape ever changes, that test fails.

`test()` honors both `context.properties` filters (`conversionKey`, `outputType`), is read-only
(one `GET`), writes no state, and throws when no hub is selected or the hub has no target fields.

> `test()` has **not** been exercised against a live Hubbi instance — verification here is
> validator + unit tests only. Confirm via `appmixer test component ./src/appmixer/hubbi/core/NewHubEvent --test`
> or Flow Test Mode before release.

> `npm run test-unit` still crashes on Windows with `spawn EINVAL` (`scripts/run_test_unit.js:45`
> spawns `mocha.cmd` without `shell: true`). Use the `npx mocha` command above. Pre-existing,
> unrelated to hubbi.

## Components Reviewed

| Component | Type | Private | Version |
|-----------|------|---------|---------|
| StartHub | Action | no | 1.1.0 |
| StartHubWithData | Action (dynamic inspector) | no | 2.0.0 |
| NewHubEvent | Trigger (webhook) | no | 1.2.0 |
| GetSourceFields | List (outputType) | yes | 1.0.0 |
| GetTargetFields | List (outputType) | yes | 1.0.0 |
| ListSourceHubsWithPostData | List (outputType) | yes | 1.0.0 |
| ListSourceHubsWithoutPostData | List (outputType) | yes | 1.0.0 |
| ListTargetHubs | List (outputType) | yes | 1.0.0 |

## Detailed Findings

### Critical Issues

None.

### Validator findings

**V1. Output port schemas are missing `example` values** (3 occurrences) — **FIXED**

```
[output-port-examples] StartHub/component.json: outPorts[0](out) options[conversionKey].schema is missing 'example'
[output-port-examples] StartHubWithData/component.json: outPorts[0](out) options[conversionKey].schema is missing 'example'
[output-port-examples] StartHubWithData/component.json: outPorts[0](out) options[count].schema is missing 'example'
```

`example` powers the variable-picker preview. Added a UUID string for `conversionKey`, `3` for `count`.

**V2. NewHubEvent has no `test(context)` method for Flow Test Mode** — **FIXED**

```
[trigger-has-test-method] core/NewHubEvent/component.json: Trigger is missing a test(context) method
```

See *Note on the `test()` implementation* above.

**V3. Connector has no MakeApiCall component** — still open

```
[connector-has-makeapicall] bundle.json: connector has no MakeApiCall component — see issue #1459
```

Repo-wide standard; many connectors still lack it. Backlog, not a blocker.

### Strict validator findings (surfaced by `--connector hubbi`, NOT by repo-wide validate)

These 7 are additional to V1-V3 and were missed in the first pass, which used the repo-wide
threshold-mode validator.

**X1. `no-select-with-source` (4 occurrences)** — every hub picker is `type: "select"` bound to a
dynamic source. The standard asks for `type: "text"` (typeahead) so the user can still enter a
conversion key by hand when the source errors or returns `[]`.

```
StartHub/component.json        inPorts[0](in).inspector.inputs.conversionKey
GetSourceFields/component.json inPorts[0](in).inspector.inputs.conversionKey
GetTargetFields/component.json inPorts[0](in).inspector.inputs.conversionKey
NewHubEvent/component.json     properties.inspector.inputs.conversionKey
```

Note the validator only sees `component.json`, so it counts 4 — but **StartHubWithData's picker has
the same problem**, declared as `type: 'select'` in `StartHubWithData.js:100`. Any fix must cover
all five.

This is the same resilience concern as N1, one layer up: N1 stopped a failed field lookup from
blanking the inspector, but the hub picker itself still has no manual fallback.

> **Resolved as a deliberate deviation (ticket 9713).** The customer explicitly asked for the
> opposite: the hub field must offer hubs *and nothing else*, because a hub is never mapped from a
> previous step in their integration. All five pickers therefore stay `type: "select"`, which is
> what prevents a conversion key from being typed by hand. Recorded as an intentional deviation in
> `scripts/validators/_ignore-list.js` (visible via `node scripts/validate.js --connector hubbi
> --show-ignored`). The trade-off the standard guards against remains real - if `ListTargetHubs` /
> `ListSourceHubs*` fails, the user cannot configure the component at all - so the endpoint failing
> is a hard block rather than a degraded experience.
>
> **The second half of the request could not be delivered.** Hiding the variable picker, so the
> dropdown stops offering the output of earlier steps, has no working mechanism at connector level.
> `"variables": false` is the documented flag and it does work on a select with a static `options`
> array, but on a select backed by a dynamic `source` it suppresses the entire option list: the hub
> dropdown came up empty. Verified in the designer by publishing Receive Hub without the flag and
> the two Start Hub actions with it - the former listed all six hubs, the latter listed none, on the
> same account in the same session. The backend was ruled out first: the source call returns 200
> with all six hubs. Supporting evidence for it being unsupported rather than misconfigured: across
> ~220 connectors in this repo there are 1067 inputs with a dynamic `source` and hubbi was the only
> place that combined one with `variables: false`; every other use of the flag sits on a select with
> static options. The flag was reverted everywhere. This is worth raising with the platform team.

**X2. `dynamic-outport-required-inputs` (3 occurrences)**

```
GetSourceFields/component.json: outPorts[0](out) source.data.messages missing required input "in/conversionKey"
GetTargetFields/component.json: outPorts[0](out) source.data.messages missing required input "in/conversionKey"
NewHubEvent/component.json:     outPorts[0](out) source.url is missing "ignoreAuth=true"
```

The first two are mechanical — both components declare `conversionKey` as required but don't pass it
to the port-options request. Harmless today (their port options are built from a static `SCHEMA`
constant that ignores the hub), but the declaration should match.

⚠️ The third needs judgment, **do not apply blindly**: `ignoreAuth=true` is right for the List
components, whose port generation makes no HTTP call. `NewHubEvent.generateOutputPortOptions()`
*does* call `TargetFields` and needs `context.auth` to do it, so adding `ignoreAuth=true` there may
break the per-hub output fields. Verify against a live instance before changing it.

### Warnings

**N1. StartHubWithData's `generateInspector` is not fault-tolerant (NEW this pass)** — **FIXED**

`core/StartHubWithData/StartHubWithData.js:52-78` calls `/Flows/Home/SourceFields` with no
`try/catch`. If that request fails — transient 5xx, an expired token, a hub whose field definitions
are unavailable — the whole inspector generation rejects. Because `component.json` declares the
in-port purely as a `source` with **no static `schema`/`inspector` fallback**, the user is left with
no inputs at all, not even the Hub picker they just used.

The sibling code path already solves exactly this: `NewHubEvent.js:88-108` isolates the equivalent
`TargetFields` lookup in a `try/catch` and degrades to the generic options rather than blanking the
port. Apply the same shape here — keep the `conversionKey` select, log the failure, and fall back to
empty `recordFields`:

```javascript
if (conversionKey) {
    try {
        // ... existing SourceFields request + field loop
    } catch (err) {
        await context.log({ step: 'Failed to load source fields for inspector', conversionKey, error: err.message });
    }
}
```

**W4. service.json has no `version` field**

The documented service.json schema lists `version`, and 95 of 149 connectors set it (54 do not).
Add `"version": "2.0.0"`.

### Suggestions

**S1.** StartHub and StartHubWithData use the `options[]` form for `outPorts`. CLAUDE.md prefers
JSON Schema (`schema`) over `options[]`. Both are accepted; converting is optional.

**S2.** `GetSourceFields` / `GetTargetFields` return arrays and use `outputType` + the lib helpers, so
they are List-shaped components carrying a `Get` prefix (per CLAUDE.md, `Get` means a single item by
ID). Both are `private: true`, so user impact is nil. Rename only if you touch them anyway.

**S3.** — **FIXED.** `auth.js` duplicated the identical `ListTargetHubs` request in `requestProfileInfo` and
`validate`. Worth one shared helper. While there: `requestProfileInfo` does `context.clientKey.slice(...)`
and `context.baseUrl.replace(...)` with no guard, so a blank field surfaces as a `TypeError` rather
than a readable auth error.

**S4.** — **FIXED.** `lib.getOutputPortOptions` took `{ label, value }` where the canonical template hardcodes
`value: 'result'`. Every current call site passes `value: 'result'`, but an omitted `value` would
silently emit `value: undefined`. Default it: `{ label, value = 'result' }`.

**S5.** The five List-shaped components' descriptions don't state a maximum record count (the
checklist asks for it). The Hubbi endpoints are unpaginated and return the full set, so there is no
real cap to state — either add "Returns all hubs for the client." or accept as-is.

**S6.** `conversionKey` uses `index: 1` in StartHub but `index: 0` in GetSourceFields, GetTargetFields
and StartHubWithData's generated inspector. Harmless (indexes only order within one component).
Relatedly, StartHubWithData's generated inspector defines no `groups` while every other component
groups its fields into Required/Settings.

### Confirmed non-issues

- **`"trigger": true` on NewHubEvent** — only 10 of 117 webhook components in this repo set it, and
  the docs' own webhook example omits it. Not a violation.
- **`"type": "object"` on `properties.schema`** — only 112 of 362 trigger-style property schemas set
  it. Not a violation.
- **`lib.js` divergence from the canonical template** — hubbi adds `mapFieldType` and
  `rethrowHubbiError`, drops the unused `getProperty`, and reorders the `array`-mode options. All
  deliberate; the array output field is still `result` and the helper contract is intact.

## Label Consistency Analysis

### Entity: Hub (`conversionKey` inspector input)

| Component | Field | Label | Tooltip | Status |
|-----------|-------|-------|---------|--------|
| StartHub | conversionKey | Hub | Select the hub to start. | OK |
| StartHubWithData | conversionKey | Hub | Select the hub to start. | OK |
| GetSourceFields | conversionKey | Hub | Select the hub to load the source field definitions from. | OK |
| GetTargetFields | conversionKey | Hub | Select the hub to load the target field definitions from. | OK |
| NewHubEvent | conversionKey | Hub | Select the hub to listen for events from. | OK |

**Resolved.** The 2.0.0 rename standardized all five on "Hub". Tooltips follow one
"Select the hub to …" pattern. Output ports correctly keep the "Conversion Key" label, where the
value genuinely is the key.

### Entity: Hub (list component record schema)

| Component | Field | Title | Status |
|-----------|-------|-------|--------|
| ListSourceHubsWithPostData | key / name | Conversion Key / Name | OK |
| ListSourceHubsWithoutPostData | key / name | Conversion Key / Name | OK |
| ListTargetHubs | key / name | Conversion Key / Name | OK |

Consistent.

### Entity: Hub field definitions

| Component | Fields | Status |
|-----------|--------|--------|
| GetSourceFields | fieldId "Field ID", name "Name", type "Type" | OK |
| GetTargetFields | fieldId "Field ID", name "Name", type "Type" | OK |

Consistent.

## Cross-Component Field Naming Analysis

### Field: `count` (record/item count on the output port)

| Component | Output Label | Value Key | Status |
|-----------|--------------|-----------|--------|
| StartHubWithData | **Records Count** | count | MISMATCH (judgment call) |
| NewHubEvent (via lib) | Items Count | count | baseline |
| GetSourceFields / GetTargetFields (via lib) | Items Count | count | OK |
| List* components (via lib) | Items Count | count | OK |

The previous review recommended renaming to "Items Count" for uniformity. Counter-argument: in
StartHubWithData the number is *records sent to the hub*, not items in a returned result set, so
"Records Count" is the more accurate label and is the only hand-written one. **Low priority — pick
either, but don't churn it twice.**

### Field: `conversionKey` (output port)

| Component | Output Label | Value Key | Status |
|-----------|--------------|-----------|--------|
| StartHub | Conversion Key | conversionKey | OK |
| StartHubWithData | Conversion Key | conversionKey | OK |

Consistent.

### Select options: `outputType`

| Component | Options | Status |
|-----------|---------|--------|
| GetSourceFields / GetTargetFields / List* | First Item Only, All items at once, One item at a time, Store to CSV file | baseline |
| NewHubEvent | **First Record, All records at once, One record at a time** | MISMATCH |

NewHubEvent says "Record" where the rest of the connector says "Item", and drops the CSV option
(correct — a trigger has no file output). Defensible as-is; the wording drift is only visible to a
user configuring both a trigger and a list component in one flow. Low priority.

### Input/output alignment

`StartHub`/`StartHubWithData` emit `conversionKey` ("Conversion Key"); the List* components emit the
same value as `key` ("Conversion Key"); every hub picker consumes it. Labels align.

## Component-by-Component Review

### StartHub
- **Type:** Action
- **Issues:** V1 (missing `example`), S1 (`options[]` over `schema`), S6 (index 1 vs 0)
- **Notes:** Required-input validation present. `lib.rethrowHubbiError` wraps the call, so 409 retries
  and 423 cancels as designed — covered by 3 dedicated tests.
- **Status:** PASS

### StartHubWithData
- **Type:** Action with dynamically generated inspector
- **Issues:** **N1 (inspector generation not fault-tolerant)**, V1, S1, S6, `count` label
- **Notes:** Validates both `conversionKey` and a non-empty `records.ADD`. `.NET` type mapping via
  `lib.mapFieldType` applied to both the inspector type and the JSON schema. The 2.0.0 removal of the
  "Records source" switch left a single, simpler code path.
- **Status:** PASS (with N1 to address)

### NewHubEvent
- **Type:** Trigger (webhook)
- **Issues:** V2 (no `test()`), outputType option wording
- **Notes:** Uses `properties` not `inPorts`; implements `start`/`receive`/`stop`; returns
  `context.response()` on every handled webhook path, including the empty-payload and
  conversionKey-mismatch short-circuits. The fault-tolerant `try/catch` in `generateOutputPortOptions`
  is the pattern N1 asks StartHubWithData to adopt. `receive` falls through to `undefined` when no
  branch matches (no webhook, no generate flag) — harmless but an explicit return would read better.
- **Status:** PASS

### GetSourceFields / GetTargetFields
- **Type:** List (private helper)
- **Issues:** S2 (List-shaped, `Get`-named), S5 (no max record count in description)
- **Notes:** Correct `lib.sendArrayOutput` / `lib.getOutputPortOptions` usage, array field is `result`,
  no limit/offset, required `conversionKey` validated, `outputType` last with the highest index.
- **Status:** PASS

### ListSourceHubsWithPostData / ListSourceHubsWithoutPostData / ListTargetHubs
- **Type:** List (private helper)
- **Issues:** S5
- **Notes:** Three near-identical files differing only in endpoint. `toSelectArray` handles both the
  `{result}` and bare-array shapes. `ignoreAuth=true` on the port-options source is correct.
- **Status:** PASS

## Recommended Fixes

Ordered by value.

1. **Wrap StartHubWithData's SourceFields lookup in try/catch** (N1)
   - File: `core/StartHubWithData/StartHubWithData.js:52-78`
   - Reason: a failed lookup currently blanks the entire inspector, including the Hub picker, because
     the in-port has no static fallback schema. NewHubEvent already does this correctly.

2. **Add `example` to output port schemas** (V1)
   - Files: `core/StartHub/component.json`, `core/StartHubWithData/component.json`
   - Suggested: `"example": "3f2504e0-4f89-11d3-9a0c-0305e82c3301"` for `conversionKey`, `"example": 3` for `count`

3. **Add a `test(context)` method to NewHubEvent** (V2) — see the `connector-test-method` skill

4. **Add `version` to service.json** (W4)
   - Suggested: `"version": "2.0.0"`

5. **Default `value` in `lib.getOutputPortOptions`** (S4)
   - File: `lib.js:117` → `{ label, value = 'result' }`

6. **Share the auth request between `requestProfileInfo` and `validate`, and guard blank fields** (S3)

7. **Align the `count` output label** — "Records Count" vs "Items Count". Judgment call; low priority.

8. **Align NewHubEvent's outputType option wording** with the List components. Low priority.

9. **Add a MakeApiCall component** (V3, issue #1459) — backlog.
