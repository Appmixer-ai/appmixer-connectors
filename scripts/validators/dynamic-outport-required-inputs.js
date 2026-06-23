'use strict';

// What this validator checks
// --------------------------
// For every dynamic outPort (one with a `source` block) in every
// component.json this validator runs two checks:
//
// 1. Required-input wiring (FAILURE)
//    Every input field marked required in an inPort's `schema.required`
//    MUST also be wired into `source.data.messages`. Two equivalent
//    formats are accepted:
//      - flat key:   `messages["<inPortName>/<fieldName>"]` (e.g. `in/query`)
//      - nested map:  `messages["<inPortName>"]["<fieldName>"]`
//                     (e.g. `{ "in": { "query": [] } }`)
//    The value is allowed to be any of the formats the engine accepts —
//    typically the literal string `"any"`, a reference like
//    `"inputs/in/query"`, or a literal placeholder such as `[]`. Only the
//    presence of the field (in either form) is enforced.
//
// 2. `ignoreAuth=true` query parameter (FAILURE, threshold-gated)
//    A dynamic outPort `source.url` should usually carry
//    `ignoreAuth=true` so the Designer can render the dropdown even when
//    the user's auth account is missing or stale. Absence is not always
//    wrong (some sources legitimately need an active session), so this
//    used to be a non-failing warning — but the warnings were noisy and
//    untracked. It is now a threshold-gated failure (ratchet): existing
//    misses are capped in scripts/validators/.thresholds.json and CI fails
//    only when the count goes UP, with the floor target at 0.
//
// Why
// ---
// Dynamic outPort `source.url` is called by the Designer to populate the
// downstream variable picker. The engine forwards entries from
// `source.data.messages` as the in-bound message for that call. If a
// required field is missing from `messages`, the component's `receive()`
// throws a `CancelError` (or the request fails inside the connector)
// because validation rejects the absent input — exactly the same failure
// path as a real runtime invocation.
//
// Skipped
// -------
// - `MakeApiCall` components — generic API helpers whose output shape
//   depends on user input at runtime; their dynamic source.url accepts
//   the user-supplied URL/method directly and required-field checks
//   don't apply.
// - outPorts without a `source` block — these are static (schema or
//   options form) and have no dynamic call to satisfy.

const path = require('path');

const { readJson } = require('./_shared');

function isMakeApiCallComponent(componentPath) {

    return path.basename(path.dirname(componentPath)) === 'MakeApiCall';
}

function collectRequiredInputs(component) {

    const inPorts = Array.isArray(component.inPorts) ? component.inPorts : [];
    const result = {};

    for (const port of inPorts) {
        if (!port || typeof port !== 'object') continue;
        if (!port.name) continue;

        const required = port.schema && Array.isArray(port.schema.required) ? port.schema.required : [];
        if (required.length > 0) {
            result[port.name] = required;
        }
    }

    return result;
}

function getMessagesMap(outPort) {

    const data = outPort.source && outPort.source.data;
    const messages = data && data.messages;

    if (!messages || typeof messages !== 'object' || Array.isArray(messages)) {
        return {};
    }

    return messages;
}

function urlHasIgnoreAuth(url) {

    if (typeof url !== 'string') return false;
    return /[?&]ignoreAuth=true(?:&|$)/.test(url);
}

function validateOutPort(componentPath, outPort, portLocation, requiredByPort, addFailure) {

    if (!outPort.source) {
        return;
    }

    // Failure (threshold-gated): recommend ignoreAuth=true on the dynamic source
    // URL so the Designer dropdown still loads when auth is missing/stale.
    if (outPort.source.url && !urlHasIgnoreAuth(outPort.source.url)) {
        addFailure(componentPath, `${portLocation} source.url is missing "ignoreAuth=true" — recommended for dynamic dropdowns`);
    }

    const messages = getMessagesMap(outPort);

    for (const [inPortName, requiredFields] of Object.entries(requiredByPort)) {
        const nested = messages[inPortName];
        const hasNestedMap = nested && typeof nested === 'object' && !Array.isArray(nested);

        for (const field of requiredFields) {
            // Accept either the flat key form (`in/list`) or the nested map form (`{ in: { list } }`).
            const hasFlatKey = `${inPortName}/${field}` in messages;
            const hasNestedKey = hasNestedMap && field in nested;

            if (!hasFlatKey && !hasNestedKey) {
                addFailure(componentPath, `${portLocation} source.data.messages missing required input "${inPortName}/${field}"`);
            }
        }
    }
}

// The `/component/<name-as-path>` URL this component's own source calls resolve to.
function selfComponentPath(component) {

    if (typeof component.name !== 'string') return null;
    return '/component/' + component.name.split('.').join('/');
}

// Same required-input contract for inspector INPUT fields whose `source`
// self-invokes this component (a dynamic typeahead, e.g. the Object Name field).
// The Designer calls that source.url to populate the field's options, and the
// engine validates the component's required inputs against source.data.messages
// before receive() runs — so every required field must be wired here too
// (typically as "any"), exactly like a dynamic outPort source. Sources that
// target a DIFFERENT component are skipped: their required contract belongs to
// that other component, not this one.
function validateInputSources(componentPath, component, requiredByPort, addFailure) {

    const selfPath = selfComponentPath(component);
    if (!selfPath) return;

    const inPorts = Array.isArray(component.inPorts) ? component.inPorts : [];

    for (const port of inPorts) {
        const inputs = port && port.inspector && port.inspector.inputs;
        if (!inputs || typeof inputs !== 'object') continue;

        for (const [fieldName, field] of Object.entries(inputs)) {
            if (!field || typeof field !== 'object' || !field.source) continue;

            const url = field.source.url;
            // Only self-invoking sources go through THIS component's required validation.
            if (typeof url !== 'string' || !url.includes(selfPath)) continue;

            const messages = getMessagesMap(field);

            for (const [inPortName, requiredFields] of Object.entries(requiredByPort)) {
                for (const requiredField of requiredFields) {
                    const key = `${inPortName}/${requiredField}`;
                    if (!(key in messages)) {
                        addFailure(componentPath, `inspector input "${fieldName}" source.data.messages missing required input "${key}"`);
                    }
                }
            }
        }
    }
}

function validateComponent(componentPath, addFailure) {

    if (isMakeApiCallComponent(componentPath)) {
        return;
    }

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    const requiredByPort = collectRequiredInputs(component);

    const outPorts = Array.isArray(component.outPorts) ? component.outPorts : [];

    for (let index = 0; index < outPorts.length; index++) {
        const port = outPorts[index];

        if (!port || typeof port !== 'object') {
            continue;
        }

        const portLocation = `outPorts[${index}](${port.name || index})`;
        validateOutPort(componentPath, port, portLocation, requiredByPort, addFailure);
    }

    validateInputSources(componentPath, component, requiredByPort, addFailure);
}

module.exports = {
    name: 'dynamic-outport-required-inputs',
    description: 'dynamic outPort (with `source`) and self-invoking inspector input sources wire every required inPort field into source.data.messages; flags missing ignoreAuth=true on outPort source.url (threshold-gated)',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
