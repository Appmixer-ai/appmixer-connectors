'use strict';

// What this validator checks
// --------------------------
// For every dynamic outPort (one with a `source` block) in every
// component.json this validator runs two checks:
//
// 1. Required-input wiring (FAILURE)
//    Every input field marked required in an inPort's `schema.required`
//    MUST also be wired into `source.data.messages`. The expected key
//    in messages is `<inPortName>/<fieldName>` (e.g. `in/query`). The
//    value is allowed to be any of the formats the engine accepts —
//    typically the literal string `"any"`, or a reference like
//    `"inputs/in/query"`. Only the KEY presence is enforced.
//
// 2. `ignoreAuth=true` query parameter (WARNING)
//    A dynamic outPort `source.url` should usually carry
//    `ignoreAuth=true` so the Designer can render the dropdown even when
//    the user's auth account is missing or stale. Absence is not always
//    wrong (some sources legitimately need an active session), so this
//    is emitted as a non-failing warning.
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

function validateOutPort(componentPath, outPort, portLocation, requiredByPort, addFailure, addWarning) {

    if (!outPort.source) {
        return;
    }

    // Warning: recommend ignoreAuth=true on the dynamic source URL so the
    // Designer dropdown still loads when auth is missing/stale.
    if (outPort.source.url && !urlHasIgnoreAuth(outPort.source.url)) {
        addWarning(componentPath, `${portLocation} source.url is missing "ignoreAuth=true" — recommended for dynamic dropdowns`);
    }

    const messages = getMessagesMap(outPort);

    for (const [inPortName, requiredFields] of Object.entries(requiredByPort)) {
        for (const field of requiredFields) {
            const key = `${inPortName}/${field}`;

            if (!(key in messages)) {
                addFailure(componentPath, `${portLocation} source.data.messages missing required input "${key}"`);
            }
        }
    }
}

function validateComponent(componentPath, addFailure, addWarning) {

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
        validateOutPort(componentPath, port, portLocation, requiredByPort, addFailure, addWarning);
    }
}

module.exports = {
    name: 'dynamic-outport-required-inputs',
    description: 'dynamic outPort (with `source`) wires every required inPort field into source.data.messages; warns if ignoreAuth=true missing from source.url',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure, context.addWarning);
        }
    }
};
