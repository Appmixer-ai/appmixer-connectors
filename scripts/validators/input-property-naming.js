'use strict';

// What this validator checks
// --------------------------
// Input property names must be camelCase: they may NOT contain a pipe `|` or an
// underscore `_`. The behavior file destructures inputs from
// `context.messages.in.content` as camelCase identifiers, so input keys in
// component.json must match that convention exactly.
//
// Checked locations (recursively, INPUTS only — output ports are not covered):
//   - inPorts[i].schema.properties.* keys
//   - inPorts[i].inspector.inputs.* keys
//   - properties.schema.properties.* / properties.inspector.inputs.* keys
//
// NOTE: this intentionally forbids `_`, which is stricter than the older
// guidance in 08-best-practices.md that permitted snake_case. The convention is
// now camelCase-only for inputs.

const { readJson } = require('./_shared');

function flagKey(componentPath, location, key, addFailure) {

    if (key.includes('|')) {
        addFailure(componentPath, `${location}.${key} uses a pipe "|" — input names must be camelCase`);
    }
    if (key.includes('_')) {
        addFailure(componentPath, `${location}.${key} uses an underscore "_" — input names must be camelCase`);
    }
}

function checkSchemaProperties(componentPath, location, schema, addFailure) {

    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return;
    }

    const properties = schema.properties;

    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
        return;
    }

    for (const key of Object.keys(properties)) {
        flagKey(componentPath, location, key, addFailure);
        // Recurse into nested object schemas.
        checkSchemaProperties(componentPath, `${location}.${key}`, properties[key], addFailure);
    }
}

function checkInspectorInputs(componentPath, location, inspector, addFailure) {

    if (!inspector || typeof inspector !== 'object' || Array.isArray(inspector)) {
        return;
    }

    const inputs = inspector.inputs;

    if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) {
        return;
    }

    for (const key of Object.keys(inputs)) {
        flagKey(componentPath, `${location}.inputs`, key, addFailure);
    }
}

function validateComponent(componentPath, addFailure) {

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    const inPorts = Array.isArray(component.inPorts) ? component.inPorts : [];

    for (let index = 0; index < inPorts.length; index++) {
        const inPort = inPorts[index] || {};
        checkSchemaProperties(componentPath, `inPorts[${index}].schema.properties`, inPort.schema, addFailure);
        checkInspectorInputs(componentPath, `inPorts[${index}].inspector`, inPort.inspector, addFailure);
    }

    if (component.properties && typeof component.properties === 'object' && !Array.isArray(component.properties)) {
        checkSchemaProperties(componentPath, 'properties.schema.properties', component.properties.schema, addFailure);
        checkInspectorInputs(componentPath, 'properties.inspector', component.properties.inspector, addFailure);
    }
}

module.exports = {
    name: 'input-property-naming',
    description: 'input property names are camelCase (no pipe "|" or underscore "_")',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
