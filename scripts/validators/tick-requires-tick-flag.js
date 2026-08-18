'use strict';

// What this validator checks
// --------------------------
// A polling trigger implements a `tick(context)` method in its behavior file.
// The engine only calls `tick()` when the component.json declares `"tick": true`
// — that flag is what subscribes the component to the engine's periodic tick
// signal (default 60s). A component that has a `tick()` method but is missing
// `"tick": true` will NEVER be polled: tick() is dead code and the trigger
// silently never fires.
//
// This validator enforces both directions:
//   FAILURE  — behavior file has a tick() method but component.json lacks `tick: true`.
//   WARNING  — component.json has `tick: true` but the behavior file has no tick() method.
//
// See .github/copilot-instructions.md (component.json "tick" property) and the
// freshdesk/fakturoid polling triggers for the canonical shape.

const fs = require('fs');
const path = require('path');

const { readJson } = require('./_shared');

// Matches a method definition named `tick`, e.g. `async tick(context) {` or
// `tick(ctx) {`. Avoids matching call expressions like `foo.tick()` (no body).
const TICK_METHOD = /\btick\s*\([^)]*\)\s*\{/;

function componentName(componentPath) {

    return path.basename(path.dirname(componentPath));
}

function validateComponent(componentPath, addFailure, addWarning) {

    let component;
    try {
        component = readJson(componentPath);
    } catch (error) {
        // JSON parse errors are reported by other validators.
        return;
    }

    const name = componentName(componentPath);
    const behaviorFile = path.join(path.dirname(componentPath), `${name}.js`);
    if (!fs.existsSync(behaviorFile)) {
        return;
    }

    let src;
    try {
        src = fs.readFileSync(behaviorFile, 'utf8');
    } catch (error) {
        return;
    }

    const hasTickMethod = TICK_METHOD.test(src);
    const hasTickFlag = component.tick === true;

    if (hasTickMethod && !hasTickFlag) {
        addFailure(componentPath,
            `${name}.js implements a tick() method but component.json is missing "tick": true — ` +
            'the engine never polls it, so the trigger silently never fires. Add "tick": true.');
    }

    if (hasTickFlag && !hasTickMethod) {
        addWarning(componentPath,
            `component.json sets "tick": true but ${name}.js has no tick() method — the tick signal is wired to nothing.`);
    }
}

module.exports = {
    name: 'tick-requires-tick-flag',
    description: 'A component with a tick() method must declare "tick": true (and vice-versa)',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure, context.addWarning);
        }
    }
};
