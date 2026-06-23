'use strict';

// What this validator checks
// --------------------------
// Rollout tracker for the connector-test-method skill: every trigger SHOULD
// expose a `test(context)` method so Flow Test Mode can emit a realistic item
// without starting the flow.
//
// A component is treated as a trigger when EITHER its manifest declares
// `webhook: true` OR its behavior file defines `tick(context)` / `start(context)`
// (the polling / listener lifecycle entry points) — AND it has no inPorts (a real
// trigger emits but never receives on an input port). Webhook triggers frequently
// handle delivery in `receive(context)` and define neither `tick()` nor `start()`,
// so the manifest's `webhook: true` flag is the only reliable signal for them;
// detecting via `start()`/`tick()` alone silently skipped ~24 webhook triggers.
// Components that are triggers but have no `test(context)` are reported.
//
// This validator is THRESHOLD-GATED (ratchet): it is listed in
// scripts/validators/.thresholds.json with a cap equal to the number of triggers
// still missing test(). CI fails only when the count goes UP (a new trigger ships
// without test()); as triggers gain test() the count drops and the threshold can
// be ratcheted down with `--update-thresholds`. The target floor is 0.
//
// Triggers where test() is intentionally absent (generic webhooks with a
// user-defined payload, deletion/diff triggers, message-queue consumers, engine
// internals with no read-only upstream to sample) are NOT special-cased here —
// they are suppressed via scripts/validators/_ignore-list.js with a recorded
// reason, like every other validator's known deviations. Run
// `node scripts/validate.js --show-ignored trigger-has-test-method` to see them.
//
// See .claude/skills/connector-test-method/SKILL.md ("Trigger groups").

const fs = require('fs');
const path = require('path');

function componentName(componentPath) {

    return path.basename(path.dirname(componentPath));
}

const TICK = /(?<![.\w])(?:async\s+)?tick\s*\(\s*context\s*\)/;
const START = /(?<![.\w])(?:async\s+)?start\s*\(\s*context\s*\)/;
// Accept both the shorthand method form `test(context) {` / `async test(context) {`
// and the object-property form `test: function (context)` / `test: async function (context)`
// that many connectors use alongside `start: async function (context)`.
// eslint-disable-next-line max-len
const TEST_METHOD = /(?<![.\w])(?:async\s+)?test\s*\(\s*context\s*\)\s*\{|(?<![.\w])test\s*:\s*(?:async\s+)?function\s*\(\s*context\s*\)/;

function validateComponent(componentPath, context) {

    const name = componentName(componentPath);
    const behaviorPath = path.join(path.dirname(componentPath), `${name}.js`);

    if (!fs.existsSync(behaviorPath)) {
        return;
    }

    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(componentPath, 'utf8'));
    } catch (error) {
        return;
    }

    // A real trigger emits but never receives on an input port. Action components
    // that define start()/receive() for connection lifecycle (and webhook-backed
    // request/response actions) all have inPorts — exclude them here.
    const hasInPorts = Array.isArray(manifest.inPorts) && manifest.inPorts.length > 0;
    if (hasInPorts) {
        return;
    }

    const source = fs.readFileSync(behaviorPath, 'utf8');
    const isTrigger = manifest.webhook === true || TICK.test(source) || START.test(source);
    if (!isTrigger) {
        return;
    }

    // Intentional "no test()" cases are suppressed centrally in _ignore-list.js
    // (keyed by validator + path), not special-cased here.
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
