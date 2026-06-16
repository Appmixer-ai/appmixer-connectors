---
description: Add a test(context) method to an Appmixer trigger for Flow Test Mode
argument-hint: <connector> [trigger-component]
---

# Add `test(context)` to a trigger

Add a `test(context)` method to a trigger component so the designer's **Flow Test Mode** can
emit one realistic, fetchable item without starting the flow or waiting for a real event.

## Arguments
Arguments provided: $ARGUMENTS

- First argument ($1): connector name — `$1`
- Second argument ($2): trigger component name (optional) — `$2`
  - If omitted, list the connector's triggers and ask which one(s) to do.

## Instructions

**First, read the full guide** at `.claude/skills/connector-test-method/SKILL.md` and follow it.
That file is the source of truth — the steps below are just the entry point. The single most
important rule: **`test()` must share the request + mapping code with `tick()`/`receive()`** so
its output is byte-for-byte identical to production. `test()` is a thin wrapper, never a parallel
implementation.

1. **Locate the trigger(s)** under `src/appmixer/$1/`. A trigger has `properties` (not `inPorts`)
   in `component.json` and a `tick()` or `start()/receive()/stop()` behavior file. If `$2` is
   given, target that component; otherwise list the triggers and confirm scope with the user.

2. **Identify the group** (see the skill's "Trigger groups" table):
   - **A** polling list+dedup → reuse the fetch+map path, queried newest-first.
   - **B** per-flow webhook → add a connector-level `fetchLatestExample()` + reshape to the
     webhook body; `receive()` has nothing to share, so reuse is across the webhook triggers.
   - **C** plugin / `addListener` → fetch one recent event via REST in the exact shape the
     listener delivers.
   - **D** generic webhook → do NOT implement.
   - **E** scheduler → synthetic well-formed payload.
   - **F** form → synthesize a value per field type.

3. **Refactor the production path into shared helpers FIRST**, then verify `tick()`/`receive()`
   still behaves identically (lint + existing tests). Only then write `test()` as a thin wrapper.

4. **Obey the hard rules** (from the skill): read-only upstream, **no state writes** of any scope,
   honor `context.properties` filters, emit exactly one item via `context.sendJson(item, '<port>')`
   with the same shape and port name as production, and `throw` when no example exists.

5. **Verify** per the skill's "Verifying your test() method" section: `npm run lint` +
   `npm run validate`, then invoke `test()` via `appmixer test component <path> --test`
   (requires a CLI version with the `--test` flag and stored auth via `appmixer test auth login`)
   or via Flow Test Mode on a live instance.

6. **Report** per trigger: group, what was extracted/shared, and the verification results.
