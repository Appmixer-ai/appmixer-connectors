'use strict';

// What this validator checks
// --------------------------
// MakeApiCall components — generic "call any endpoint" helpers — must
// follow the standard structure documented in
//   https://github.com/Appmixer-ai/appmixer-components/issues/1459
//
// Mandatory inputs (FAILURE if missing or wrong shape):
//   • url        (string, required)         — text input,    "API Endpoint Path"
//   • method     (string, required, enum)   — select input,  defaultValue "GET",
//                                              5 options: GET, POST, PUT, PATCH, DELETE
//   • headers    (array)                    — key-value      list of header pairs
//   • parameters (array)                    — key-value      list of query-param pairs (note: not "params")
//   • body       (string)                   — textarea       JSON body — keeps textarea/JSON
//                                              because many APIs require nested
//                                              JSON bodies (objects, arrays,
//                                              non-string values). Only headers
//                                              and parameters are naturally flat
//                                              string maps; the body is not.
//
// Soft conformance (WARNING):
//   • method.enum is the full set of 5 HTTP verbs
//   • OAuth-based connectors (auth.js exports type: 'oauth2'): the
//     component's auth.scope is non-empty (per #1459 recommendation to
//     use the most-privileged scope, or all scopes when not determinable).
//
// Scope
// -----
// Runs on every component whose folder name is `MakeApiCall`. Connectors
// without a MakeApiCall component are not flagged — the validator only
// asserts that existing MakeApiCall components match the standard.

const fs = require('fs');
const path = require('path');

const { readJson } = require('./_shared');

const STANDARD_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const STANDARD_FIELDS = [
    { field: 'url', schemaType: 'string', inspectorType: 'text' },
    { field: 'method', schemaType: 'string', inspectorType: 'select' },
    { field: 'headers', schemaType: 'array', inspectorType: 'key-value' },
    { field: 'parameters', schemaType: 'array', inspectorType: 'key-value' },
    { field: 'body', schemaType: 'string', inspectorType: 'textarea' }
];

function isMakeApiCall(componentPath) {

    return path.basename(path.dirname(componentPath)) === 'MakeApiCall';
}

function getConnectorRoot(componentPath) {

    // .../src/appmixer/<vendor>/.../MakeApiCall/component.json
    const parts = componentPath.split(path.sep);
    const idx = parts.lastIndexOf('appmixer');
    if (idx < 0 || idx + 1 >= parts.length) {
        return null;
    }

    return parts.slice(0, idx + 2).join(path.sep);
}

function isOAuth2Connector(connectorRoot) {

    if (!connectorRoot) return false;

    const authPath = path.join(connectorRoot, 'auth.js');
    if (!fs.existsSync(authPath)) return false;

    const content = fs.readFileSync(authPath, 'utf8');
    return /type:\s*['"]oauth2['"]/.test(content);
}

function validateInputSchemaField(componentPath, props, required, field, expectedSchemaType, addFailure) {

    const prop = props[field];

    if (!prop || typeof prop !== 'object') {
        addFailure(componentPath, `inPorts[0].schema.properties.${field} is missing (standard #1459)`);
        return;
    }

    if (prop.type !== expectedSchemaType) {
        addFailure(componentPath, `inPorts[0].schema.properties.${field}.type must be "${expectedSchemaType}" (found "${prop.type}")`);
    }
}

function validateInspectorInput(componentPath, inputs, field, expectedType, addFailure) {

    const input = inputs[field];

    if (!input || typeof input !== 'object') {
        addFailure(componentPath, `inspector.inputs.${field} is missing`);
        return;
    }

    if (input.type !== expectedType) {
        addFailure(componentPath, `inspector.inputs.${field}.type must be "${expectedType}" (found "${input.type}")`);
    }
}

function validateMethodSpec(componentPath, props, inputs, addFailure, addWarning) {

    const methodProp = props.method;
    if (methodProp) {
        const enumValues = Array.isArray(methodProp.enum) ? methodProp.enum : null;

        if (!enumValues) {
            addWarning(componentPath, `inPorts[0].schema.properties.method should declare enum [${STANDARD_METHODS.join(', ')}]`);
        } else {
            const missing = STANDARD_METHODS.filter((m) => !enumValues.includes(m));
            if (missing.length > 0) {
                addWarning(componentPath, `inPorts[0].schema.properties.method.enum is missing: ${missing.join(', ')}`);
            }
        }
    }

    const methodInput = inputs.method;
    if (methodInput) {
        if (methodInput.defaultValue !== 'GET') {
            addFailure(componentPath, `inspector.inputs.method.defaultValue must be "GET" (found ${JSON.stringify(methodInput.defaultValue)})`);
        }

        const options = Array.isArray(methodInput.options) ? methodInput.options : [];
        const values = options.map((option) => option && option.value).filter(Boolean);
        const missing = STANDARD_METHODS.filter((m) => !values.includes(m));

        if (missing.length > 0) {
            addFailure(componentPath, `inspector.inputs.method.options missing values: ${missing.join(', ')}`);
        }
    }
}

function validateScope(componentPath, component, connectorRoot, addWarning) {

    if (!isOAuth2Connector(connectorRoot)) {
        return;
    }

    const scope = component.auth && component.auth.scope;

    if (!Array.isArray(scope) || scope.length === 0) {
        addWarning(componentPath, 'auth.scope is empty — OAuth-based MakeApiCall should declare scopes (most-privileged or all; see #1459)');
    }
}

function validateComponent(componentPath, addFailure, addWarning) {

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    const inPort = Array.isArray(component.inPorts) ? component.inPorts[0] : null;

    if (!inPort || typeof inPort !== 'object') {
        addFailure(componentPath, 'inPorts[0] is missing');
        return;
    }

    const schema = inPort.schema || {};
    const props = (schema.properties && typeof schema.properties === 'object') ? schema.properties : {};
    const required = Array.isArray(schema.required) ? schema.required : [];
    const inputs = (inPort.inspector && inPort.inspector.inputs && typeof inPort.inspector.inputs === 'object')
        ? inPort.inspector.inputs
        : {};

    // Legacy field flagged explicitly so the fix is obvious.
    if ('params' in props && !('parameters' in props)) {
        addFailure(componentPath, 'inPorts[0].schema.properties.params is legacy — rename to "parameters" (standard #1459)');
    }

    for (const { field, schemaType, inspectorType } of STANDARD_FIELDS) {
        validateInputSchemaField(componentPath, props, required, field, schemaType, addFailure);
        validateInspectorInput(componentPath, inputs, field, inspectorType, addFailure);
    }

    for (const field of ['url', 'method']) {
        if (!required.includes(field)) {
            addFailure(componentPath, `inPorts[0].schema.required must include "${field}"`);
        }
    }

    validateMethodSpec(componentPath, props, inputs, addFailure, addWarning);
    validateScope(componentPath, component, getConnectorRoot(componentPath), addWarning);
}

module.exports = {
    name: 'makeapicall-standards',
    description: 'MakeApiCall components follow the input/output structure defined in issue #1459',
    run(context) {
        for (const componentPath of context.componentFiles) {
            if (isMakeApiCall(componentPath)) {
                validateComponent(componentPath, context.addFailure, context.addWarning);
            }
        }
    }
};
