'use strict';

// What this validator checks
// --------------------------
// When a trigger's behavior file defines a `test(context)` method (Flow Test Mode
// example data, added by the connector-test-method skill), that method must obey
// the skill's hard rules:
//
//   1. No state writes of any scope. Test Mode never starts/stops the flow, so any
//      saveState / stateSet / stateUnset / stateClear / stateInc / stateAddToSet /
//      stateRemoveFromSet call (incl. flow.* / service.* variants) and any
//      `context.state = ...` assignment leaks.
//   2. Emit exactly one item — `context.sendJson(item, '<port>')`, never
//      `sendArray` / `sendArrayOutput`.
//   3. Must actually emit something: a `sendJson(...)` call has to be present.
//
// Scope: the checks apply ONLY to the body of the `test(` method (extracted by
// brace matching), so a `tick()` that legitimately saves state is never flagged.
// Any component behavior file that declares a `test(` method is examined — no
// trigger-vs-action classification is needed.
//
// A missing `throw` (the "no example available" fallback) is reported as a
// warning, not a failure, since some test() variants legitimately always emit.
//
// See .claude/skills/connector-test-method/SKILL.md ("Hard rules").

const fs = require('fs');
const path = require('path');

function componentName(componentPath) {

    return path.basename(path.dirname(componentPath));
}

// Matches the `test(context) {` method definition (optionally `async`), anchored
// on the `context` parameter + opening brace so it cannot match a `.test(...)`
// regex/string call (negative lookbehind on `.`) or a word ending in "test(".
const TEST_METHOD = /(?<![.\w])(?:async\s+)?test\s*\(\s*context\s*\)\s*\{/;

// Extracts the body of the `test(context)` method from source via brace matching,
// returning the substring from the opening `{` to its matching `}`, or null if the
// method is not present. Coarse (does not skip braces inside strings or comments)
// but adequate for these small behavior files — matching the regex-based style of
// the other validators.
function extractTestBody(source) {

    const match = TEST_METHOD.exec(source);
    if (!match) {
        return null;
    }

    // The matched signature ends with the method's opening brace.
    const open = match.index + match[0].length - 1;

    let depth = 0;
    for (let i = open; i < source.length; i++) {
        const char = source[i];
        if (char === '{') {
            depth++;
        } else if (char === '}') {
            depth--;
            if (depth === 0) {
                return source.slice(open, i + 1);
            }
        }
    }

    return null;
}

const STATE_WRITE = /\b(?:saveState|stateSet|stateUnset|stateClear|stateInc|stateAddToSet|stateRemoveFromSet)\s*\(/;
const STATE_ASSIGN = /context\.state\s*=[^=]/;
const ARRAY_OUTPUT = /\bsendArray(?:Output)?\s*\(/;
const SEND_JSON = /\bsendJson\s*\(/;
const THROWS = /\bthrow\b/;

function validateComponent(componentPath, context) {

    const name = componentName(componentPath);
    const behaviorPath = path.join(path.dirname(componentPath), `${name}.js`);

    if (!fs.existsSync(behaviorPath)) {
        return;
    }

    const source = fs.readFileSync(behaviorPath, 'utf8');
    const body = extractTestBody(source);
    if (body === null) {
        // No test() method — nothing to enforce (coverage is tracked separately).
        return;
    }

    if (STATE_WRITE.test(body) || STATE_ASSIGN.test(body)) {
        context.addFailure(componentPath, `test() must not write state (no saveState/stateSet/state = ...) — found in ${name}.js`);
    }

    if (ARRAY_OUTPUT.test(body)) {
        context.addFailure(componentPath, `test() must emit a single item with sendJson, not sendArray/sendArrayOutput — found in ${name}.js`);
    }

    if (!SEND_JSON.test(body)) {
        context.addFailure(componentPath, `test() must emit exactly one item via context.sendJson(item, '<port>') — no sendJson found in ${name}.js`);
    }

    if (!THROWS.test(body)) {
        context.addWarning(componentPath, `test() should throw when no example is available so the engine fallback chain takes over — no throw found in ${name}.js`);
    }
}

module.exports = {
    name: 'trigger-test-method',
    description: 'Trigger test() methods are read-only, write no state, and emit one item via sendJson',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context);
        }
    }
};
