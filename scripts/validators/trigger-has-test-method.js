'use strict';

// What this validator checks
// --------------------------
// Rollout tracker for the connector-test-method skill: every trigger SHOULD
// expose a `test(context)` method so Flow Test Mode can emit a realistic item
// without starting the flow.
//
// A component is treated as a trigger when its behavior file defines `tick(context)`
// or `start(context)` (the polling / webhook lifecycle entry points). Components
// that have such a method but no `test(context)` are reported.
//
// This validator is THRESHOLD-GATED (ratchet): it is listed in
// scripts/validators/.thresholds.json with a cap equal to the number of triggers
// still missing test(). CI fails only when the count goes UP (a new trigger ships
// without test()); as triggers gain test() the count drops and the threshold can
// be ratcheted down with `--update-thresholds`. The target floor is 0.
//
// SKIP holds the few triggers where test() is intentionally not implemented
// (skill "Group D" generic webhooks with a user-defined payload and no upstream
// record to fetch). These are excluded so the floor stays at 0.
//
// See .claude/skills/connector-test-method/SKILL.md ("Trigger groups").

const fs = require('fs');
const path = require('path');

function componentName(componentPath) {

    return path.basename(path.dirname(componentPath));
}

// Triggers where test() is intentionally absent. Keyed by the connector-relative
// path so renames surface as a miss rather than a silent skip. Three reasons:
//   1. Group D generic webhooks with no schema/upstream, and the up/down monitor
//      that has no record to fetch.
//   2. Action components that define start() only for driver/connection lifecycle
//      (they have inPorts and a receive() that does the work) — not triggers.
//   3. Message-queue consumers and internal engine-event triggers with no read-only
//      way to sample a representative item (consuming is destructive / no upstream API).
const SKIP = new Set([
    // 1. Generic webhooks / monitors with no upstream record to fetch.
    'utils/http/DynamicWebhook',
    'utils/http/Uptime',
    // 2. Action components that define start() for connection lifecycle only.
    'mongodb/db/CreateDocument',
    'mongodb/db/DeleteDocument',
    'mongodb/db/Query',
    'mongodb/db/UpdateDocument',
    'rabbitmq/platform/Publish',
    'rabbitmq/platform/SendToQueue',
    'kafka/platform/SendMessage',
    // 3. Message-queue consumers / internal engine events — no read-only sample.
    'rabbitmq/platform/NewMessage',
    'kafka/platform/NewMessage',
    'system/core/OnAnyFlowComponentError',
    // 3b. Inbound-only webhooks with no REST endpoint to fetch a past event
    // (LINE messaging is push/reply only — received messages can't be listed).
    'line/core/NewMessages',
    // 4. Action components that use start() for lifecycle but have an `in` port and
    // perform a mutation — not fetchable triggers (no read-only item to sample).
    'wiz/core/UploadScan',
    'plivo/sms/SendSMSAndWaitForReply',
    // 5. Diff/delta-based deletion triggers — a deleted item no longer exists upstream
    // and there is no read-only endpoint that lists "currently deleted" items, so the
    // production payload (removed/trashed facet) cannot be reconstructed faithfully.
    'microsoft/sharepoint/DeletedFile',
    'google/bigquery/DeletedRow',
    'google/drive/DeletedFileOrFolder',
    // 6. Event with no read-only upstream reachable from the trigger's properties
    // (beehiiv exposes no publication-wide survey-response list endpoint).
    'beehiiv/core/SurveyResponseSubmitted',
    // 7. Engine-internal / control / test-harness components. These have no external
    // upstream to sample: utils/test/* are E2E-flow harness pieces, utils/storage/*
    // fire on internal store changes, and utils/controls/* are input-port control
    // components (not event triggers).
    'utils/test/AfterAll',
    'utils/test/CallCount',
    'utils/test/Tick',
    'utils/storage/OnItemAdded',
    'utils/storage/OnItemRemoved',
    'utils/storage/OnItemUpdated',
    'utils/controls/Counter',
    'utils/controls/Digest'
]);

const TICK = /(?<![.\w])(?:async\s+)?tick\s*\(\s*context\s*\)/;
const START = /(?<![.\w])(?:async\s+)?start\s*\(\s*context\s*\)/;
const TEST_METHOD = /(?<![.\w])(?:async\s+)?test\s*\(\s*context\s*\)\s*\{/;

function relativeToConnectors(componentPath) {

    // .../src/appmixer/<connector>/<...>/<Component> -> <connector>/<...>/<Component>
    const dir = path.dirname(componentPath);
    const marker = `${path.sep}appmixer${path.sep}`;
    const idx = dir.indexOf(marker);
    return idx === -1 ? dir : dir.slice(idx + marker.length);
}

function validateComponent(componentPath, context) {

    const name = componentName(componentPath);
    const behaviorPath = path.join(path.dirname(componentPath), `${name}.js`);

    if (!fs.existsSync(behaviorPath)) {
        return;
    }

    const source = fs.readFileSync(behaviorPath, 'utf8');
    const isTrigger = TICK.test(source) || START.test(source);
    if (!isTrigger) {
        return;
    }

    if (SKIP.has(relativeToConnectors(componentPath))) {
        return;
    }

    if (!TEST_METHOD.test(source)) {
        context.addFailure(componentPath, `Trigger is missing a test(context) method for Flow Test Mode — see the connector-test-method skill (${name}.js)`);
    }
}

module.exports = {
    name: 'trigger-has-test-method',
    description: 'Triggers expose a test(context) method for Flow Test Mode (ratchet)',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context);
        }
    }
};
