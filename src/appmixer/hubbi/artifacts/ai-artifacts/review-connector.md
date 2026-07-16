# Connector Review: hubbi

**Review Date:** 2026-07-16
**Reviewer:** Claude AI
**Branch:** feature/hubbi
**Bundle version:** 2.0.0

## Summary

| Category | Status | Issues Found | Fixed |
|----------|--------|--------------|-------|
| Structural | FIXED | 3 (2 blocking) | 2 |
| Component Types | PASS | 2 (non-blocking) | 0 |
| Label Consistency | FIXED | 3 | 1 |
| Code Quality | PASS | 4 (suggestions) | 0 |

`npm run validate` failed on this connector at review time and **now passes** — both blocking
findings (C1, C2) were fixed. ESLint is clean: the 689 reported errors are all `linebreak-style`
caused by `core.autocrlf=true` on this Windows checkout (box reports 797 of the same), not by
connector code.

## Fixes Applied (2026-07-16)

| # | Fix | Files |
|---|-----|-------|
| C1 | Reordered bundle.json changelog oldest-first (1.0.0 → 2.0.0) | `bundle.json` |
| C2 | Added `webhookUrl` to NewHubEvent `properties.schema.properties` | `core/NewHubEvent/component.json` |
| W1 | NewHubEvent acknowledges an empty event instead of throwing/emitting | `core/NewHubEvent/NewHubEvent.js` |
| 5 | Standardized the hub select label to "Hub" across all five components; output ports keep "Conversion Key" | `core/StartHub/component.json`, `core/GetSourceFields/component.json`, `core/GetTargetFields/component.json`, `core/StartHubWithData/StartHubWithData.js` |
| — | Regression cover for W1: 10 new cases across all three output types | `test/hubbi/NewHubEvent.test.js` |
| — | Recorded the label rename and the W1 behavior change in the unreleased 2.0.0 changelog | `bundle.json` |

Verified: all edited JSON parses; `npm run validate` no longer reports `[bundle-versions]` or
`[component-schemas]` for hubbi; the hubbi suite passes 75/75; the 6 new empty-payload assertions
fail against the unfixed component, confirming they pin the regression.

### Note: W1 changed a behavior an existing test had pinned

`test/hubbi/NewHubEvent.test.js` contained `emits an empty result when there is no data payload`,
asserting the old `array`-mode output of `{ result: [], count: 0 }`. That test was replaced, not
deleted around. It came from commit `11126b45` ("test(hubbi): add unit test suite for the Hubbi
connector"), a single after-the-fact suite that characterized existing behavior rather than
specifying intended behavior — so the empty emission was captured, not designed. The W1 fix means
an empty event no longer triggers the flow in **any** output type, which is broader than only
repairing the `first`-mode crash. If the old `array` behavior is wanted, scope the guard in
`NewHubEvent.js` to `outputType === 'first'` and restore the original assertion.

**Still open** (deferred by reviewer): W2 (`test()` method), W3 (`example` values), W4
(service.json `version`), W5 (MakeApiCall), the `count` label mismatch, and the outputType option
wording.

### Unrelated environment issues found while testing

- `npm run test-unit` crashes on Windows with `spawn EINVAL` — `scripts/run_test_unit.js:45`
  spawns `mocha.cmd` without `shell: true`. Workaround: `npx mocha --recursive --exit "test/hubbi/**/*.test.js"`.
- The repo-wide suite fails in `test/mssql/validateQuery.test.js` with `MODULE_NOT_FOUND`
  (mssql dependency not installed locally). Pre-existing, unrelated to hubbi.

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

**C1. bundle.json changelog is ordered newest-first; validator requires oldest-first**

`[bundle-versions] src/appmixer/hubbi/bundle.json: changelog must be ordered oldest-first`

Found `[2.0.0, 1.6.0, 1.5.0, 1.4.1, 1.4.0, 1.3.0, 1.2.0, 1.1.1, 1.1.0, 1.0.0]`,
expected `[1.0.0, 1.1.0, 1.1.1, 1.2.0, 1.3.0, 1.4.0, 1.4.1, 1.5.0, 1.6.0, 2.0.0]`.
Fix: reverse the key order in the `changelog` object. Content is unchanged.

**C2. NewHubEvent: `webhookUrl` inspector input is missing from `properties.schema.properties`**

`[component-schemas] src/appmixer/hubbi/core/NewHubEvent/component.json: properties inspector input 'webhookUrl' is missing from schema.properties`

The inspector declares a `webhookUrl` input but the properties schema only declares
`generateInspector`, `conversionKey`, and `outputType`. Add:

```json
"webhookUrl": { "type": "string" }
```

### Warnings

**W1. NewHubEvent can return an error response to Hubbi for an empty event**

In `NewHubEvent.js:46`, `lib.sendArrayOutput` is called before `context.response()`. When
`outputType` is `first` and the webhook payload carries no records, `lib.sendArrayOutput`
throws `CancelError('No records available for first output type')` (`lib.js:88-89`), so
`context.response()` never runs and Hubbi receives an error instead of a 200. A trigger should
acknowledge the webhook regardless. Suggested guard before the send:

```javascript
if (records.length === 0) {
    await context.log({ step: 'Webhook ignored, no records in payload' });
    return context.response();
}
```

**W2. NewHubEvent has no `test(context)` method for Flow Test Mode**

`[trigger-has-test-method] .../NewHubEvent/component.json: Trigger is missing a test(context) method`

See the `connector-test-method` skill.

**W3. Output port schemas are missing `example` values**

```
[output-port-examples] StartHub/component.json: outPorts[0](out) options[conversionKey].schema is missing 'example'
[output-port-examples] StartHubWithData/component.json: outPorts[0](out) options[conversionKey].schema is missing 'example'
[output-port-examples] StartHubWithData/component.json: outPorts[0](out) options[count].schema is missing 'example'
```

`example` powers the variable-picker preview. Suggested: a UUID for `conversionKey`, `3` for `count`.

**W4. service.json has no `version` field**

The documented service.json schema lists `version`, and 95 of 149 connectors set it. Add `"version": "2.0.0"`.

**W5. Connector has no MakeApiCall component**

`[connector-has-makeapicall] src/appmixer/hubbi/bundle.json: connector has no MakeApiCall component — see issue #1459`

Repo-wide standard, though a number of connectors currently lack it. Treat as backlog, not a blocker.

### Suggestions

**S1.** StartHub and StartHubWithData use the `options[]` form for outPorts. CLAUDE.md prefers
JSON Schema (`schema`) over `options[]`.

**S2.** `GetSourceFields` / `GetTargetFields` return arrays and use `outputType` + lib helpers, so
they are List-shaped components named with the `Get` prefix (per CLAUDE.md, `Get` means a single
item by ID). Both are `private: true`, so user impact is nil. Rename only if you touch them anyway.

**S3.** `auth.js` duplicates the identical ListTargetHubs request in `requestProfileInfo` and
`validate`. Could share one helper.

**S4.** `conversionKey` uses `index: 1` in StartHub but `index: 0` in GetSourceFields, GetTargetFields
and StartHubWithData's generated inspector. Harmless (indexes only order within a component) but
inconsistent.

## Label Consistency Analysis

### Entity: Hub (conversionKey input)

| Component | Field | Label | Tooltip | Status |
|-----------|-------|-------|---------|--------|
| StartHub | conversionKey | Conversion Key | The conversion identifier (UUID) of the hub to start. | baseline |
| StartHubWithData | conversionKey | Conversion Key | The conversion identifier (UUID) of the hub to start. | OK |
| GetSourceFields | conversionKey | Conversion Key | The conversion identifier (UUID) of the hub. | OK |
| GetTargetFields | conversionKey | Conversion Key | The conversion identifier (UUID) of the hub. | OK |
| NewHubEvent | conversionKey | **Hub** | Select the hub to listen for events from. | **MISMATCH** |

All five inputs are the same thing: a `select` populated with hub names whose value is the hub's
conversion key. NewHubEvent labels it "Hub"; everything else labels it "Conversion Key".

**Recommendation:** standardize on **"Hub"** everywhere, not "Conversion Key". The control shows a
list of hub *names* and the user is picking a hub — "Conversion Key" describes the stored value,
not the choice, and reads as though a UUID must be pasted in. The output ports can keep the
"Conversion Key" label, since there the value genuinely is the key. This is a judgment call and
the reverse (standardize on "Conversion Key") is defensible; it just makes four inspectors worse
instead of making one better.

### Entity: Hub (list component record schema)

| Component | Field | Title | Status |
|-----------|-------|-------|--------|
| ListSourceHubsWithPostData | key | Conversion Key | OK |
| ListSourceHubsWithoutPostData | key | Conversion Key | OK |
| ListTargetHubs | key | Conversion Key | OK |
| all three | name | Name | OK |

Consistent.

### Field: Hub field definitions

| Component | Fields | Status |
|-----------|--------|--------|
| GetSourceFields | fieldId "Field ID", name "Name", type "Type" | OK |
| GetTargetFields | fieldId "Field ID", name "Name", type "Type" | OK |

Consistent.

## Cross-Component Field Naming Analysis

### Field: `count` (record/item count on the output port)

| Component | Output Label | Value Key | Status |
|-----------|--------------|-----------|--------|
| StartHubWithData | **Records Count** | count | **MISMATCH** |
| NewHubEvent (via lib) | Items Count | count | OK (baseline) |
| GetSourceFields (via lib) | Items Count | count | OK |
| GetTargetFields (via lib) | Items Count | count | OK |
| List* components (via lib) | Items Count | count | OK |

**Recommendation:** rename StartHubWithData's `count` label to **"Items Count"** to match the shared
`lib.getOutputPortOptions` helper, which every other component in the connector inherits.

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
| NewHubEvent | **First Record, All records at once, One record at a time** | **MISMATCH** |

NewHubEvent says "Record" where the rest of the connector says "Item", and drops the CSV option
(correct — a trigger has no file output). Defensible as-is, since the trigger genuinely emits hub
records, but the wording drift is visible to users configuring both a trigger and a list component
in one flow.

**Recommendation:** low priority. If aligning, change NewHubEvent to "First Item Only" /
"All items at once" / "One item at a time".

## Component-by-Component Review

### StartHub
- **Type:** Action
- **Issues:** W3 (missing `example` on output schema), S1 (`options[]` over `schema`), S4 (index 1 vs 0)
- **Status:** PASS (with warnings)

### StartHubWithData
- **Type:** Action with dynamically generated inspector
- **Issues:** W3, S1, `count` labeled "Records Count" vs lib's "Items Count"
- **Notes:** Required-input validation present for both `conversionKey` and empty `records`. `.NET`
  type mapping via `lib.mapFieldType` is applied correctly. `lib.rethrowHubbiError` wraps the write call.
- **Status:** PASS (with warnings)

### NewHubEvent
- **Type:** Trigger (webhook)
- **Issues:** **C2 (validator failure)**, W1 (error response on empty `first` payload), W2 (no `test()`), label "Hub" vs "Conversion Key", outputType option wording
- **Notes:** Correctly uses `properties` not `inPorts`; implements `start`/`receive`/`stop`; returns
  `context.response()` on all handled paths except the W1 case. The fault-tolerant try/catch around
  the TargetFields lookup in `generateOutputPortOptions` is a good call — a lookup failure degrades
  to generic options instead of blanking the port. Absence of `"trigger": true` is **not** an issue:
  only 2 of 149 components in this repo set it, and the docs' own webhook example omits it.
- **Status:** FAIL (C2 blocks `npm run validate`)

### GetSourceFields / GetTargetFields
- **Type:** List (private helper)
- **Issues:** S2 (List-shaped but `Get`-named); descriptions don't state a maximum record count
- **Notes:** Correct use of `lib.sendArrayOutput` / `lib.getOutputPortOptions`, array field is `result`,
  no limit/offset, required `conversionKey` validated.
- **Status:** PASS

### ListSourceHubsWithPostData / ListSourceHubsWithoutPostData / ListTargetHubs
- **Type:** List (private helper)
- **Issues:** descriptions don't state a maximum record count
- **Notes:** Three near-identical files differing only in endpoint. Correct lib helper usage,
  `outputType` last with highest index, no limit/offset, `toSelectArray` handles both the
  `{result}` and bare-array shapes.
- **Status:** PASS

## Recommended Fixes

1. **Reverse bundle.json changelog order** (blocks `npm run validate`)
   - File: `src/appmixer/hubbi/bundle.json`
   - Current: `2.0.0` first, `1.0.0` last
   - Suggested: `1.0.0` first, `2.0.0` last
   - Reason: `[bundle-versions]` validator requires oldest-first

2. **Add `webhookUrl` to NewHubEvent properties schema** (blocks `npm run validate`)
   - File: `src/appmixer/hubbi/core/NewHubEvent/component.json`
   - Suggested: add `"webhookUrl": { "type": "string" }` to `properties.schema.properties`
   - Reason: `[component-schemas]` validator requires every inspector input to be declared

3. **Guard the empty-records case in NewHubEvent**
   - File: `src/appmixer/hubbi/core/NewHubEvent/NewHubEvent.js:46`
   - Reason: `outputType: 'first'` + empty payload throws before `context.response()`, returning an
     error to Hubbi instead of acknowledging the webhook

4. **Add `example` to output port schemas**
   - Files: `StartHub/component.json`, `StartHubWithData/component.json`
   - Reason: `[output-port-examples]` validator; powers the variable-picker preview

5. **Standardize the hub select label**
   - Files: all five components with a `conversionKey` select
   - Current: "Hub" in NewHubEvent, "Conversion Key" in the other four
   - Suggested: "Hub" everywhere
   - Reason: the control is a hub-name picker; "Conversion Key" describes the stored value

6. **Rename StartHubWithData's `count` output label**
   - File: `src/appmixer/hubbi/core/StartHubWithData/component.json`
   - Current: "Records Count"
   - Suggested: "Items Count"
   - Reason: matches `lib.getOutputPortOptions`, which every other component inherits

7. **Add `version` to service.json**
   - File: `src/appmixer/hubbi/service.json`
   - Suggested: `"version": "2.0.0"`

8. **Add a `test(context)` method to NewHubEvent** — see the `connector-test-method` skill

9. **Add a MakeApiCall component** (backlog, issue #1459)
