'use strict';

// What this validator checks
// --------------------------
// For every `component.json` under src/appmixer:
//   - For each `inPorts[i]`: every key in `inPorts[i].inspector.inputs` must be
//     reachable in `inPorts[i].schema.properties` (dotted paths like `foo.bar`
//     traverse nested object schemas).
//   - For component-level `properties` (used by triggers / configuration-only
//     components): every key in `properties.inspector.inputs` must be reachable
//     in `properties.schema.properties`.
//   - Schemas using `oneOf` or `anyOf` are skipped (intentionally — see TODO
//     in the implementation; remove the skip once we model those properly).
//
// Why
// ---
// At runtime the engine binds inspector input values into the message payload /
// `context.properties` using the schema as the contract. An input that has no
// matching schema property is silently dropped, leading to "the field is in the
// UI but never reaches the component" bugs that are painful to diagnose by hand.

const { readJson } = require('./_shared');

function getSchemaProperties(schema) {

    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return new Set();
    }

    const properties = schema.properties;

    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
        return new Set();
    }

    return new Set(Object.keys(properties));
}

function schemaUsesUnsupportedExpressions(schema) {

    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return false;
    }

    // TODO: we should ideally support these at some point,
    // but for now we want to allow them in the schema without causing false positives in the inspector validation
    if (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) {
        return true;
    }

    for (const value of Object.values(schema)) {
        if (Array.isArray(value)) {
            for (const item of value) {
                if (schemaUsesUnsupportedExpressions(item)) {
                    return true;
                }
            }
            continue;
        }

        if (schemaUsesUnsupportedExpressions(value)) {
            return true;
        }
    }

    return false;
}

function schemaHasPropertyPath(schema, inputName) {

    if (!inputName) {
        return false;
    }

    const directProperties = getSchemaProperties(schema);

    if (directProperties.has(inputName)) {
        return true;
    }

    const parts = inputName.split('.');
    let currentSchema = schema;

    for (const part of parts) {
        if (!currentSchema || typeof currentSchema !== 'object' || Array.isArray(currentSchema)) {
            return false;
        }

        const properties = currentSchema.properties;

        if (!properties || typeof properties !== 'object' || Array.isArray(properties) || !properties[part]) {
            return false;
        }

        currentSchema = properties[part];
    }

    return true;
}

function validateInspectorAgainstSchema(filePath, location, schema, inspector, addFailure) {

    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return;
    }

    if (schemaUsesUnsupportedExpressions(schema)) {
        return;
    }

    if (!inspector || typeof inspector !== 'object' || Array.isArray(inspector)) {
        return;
    }

    const inputs = inspector.inputs;

    if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) {
        return;
    }

    for (const inputName of Object.keys(inputs)) {
        if (!schemaHasPropertyPath(schema, inputName)) {
            addFailure(filePath, `${location} inspector input '${inputName}' is missing from schema.properties`);
        }
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
        const inPort = inPorts[index];
        validateInspectorAgainstSchema(componentPath, `inPorts[${index}]`, inPort.schema, inPort.inspector, addFailure);
    }

    if (component.properties && typeof component.properties === 'object' && !Array.isArray(component.properties)) {
        validateInspectorAgainstSchema(componentPath, 'properties', component.properties.schema, component.properties.inspector, addFailure);
    }
}

module.exports = {
    name: 'component-schemas',
    description: 'inspector inputs are declared in inPorts[*].schema.properties',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
