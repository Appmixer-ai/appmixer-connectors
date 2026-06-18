'use strict';

// What this validator checks
// --------------------------
// When a schema property is a date/datetime value (`"format": "date-time"`), its
// inspector input must use the `date-time` inspector type — never `text`.
// A plain text input for a date field gives the user no date picker and lets
// malformed values through.
//
// For each inPort (and component-level `properties`):
//   schema.properties[key].format === 'date-time'
//     => inspector.inputs[key].type must be 'date-time'
//
// Only flags when an inspector input exists for the field but uses the wrong
// type; a missing inspector entry is a different validator's concern.
//
// See 08-best-practices.md ("Date/Time Input Types").

const { readJson } = require('./_shared');

function checkSection(componentPath, location, schema, inspector, addFailure) {

    const props = schema && schema.properties;
    const inputs = inspector && inspector.inputs;

    if (!props || typeof props !== 'object' || Array.isArray(props)) return;
    if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) return;

    for (const key of Object.keys(props)) {
        const prop = props[key];
        if (!prop || typeof prop !== 'object') continue;
        if (prop.format !== 'date-time') continue;

        const input = inputs[key];
        if (!input || typeof input !== 'object') continue;

        if (input.type !== 'date-time') {
            addFailure(componentPath, `${location}.${key} has schema format "date-time" but inspector type is ${JSON.stringify(input.type)} — must be "date-time"`);
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
        const inPort = inPorts[index] || {};
        checkSection(componentPath, `inPorts[${index}]`, inPort.schema, inPort.inspector, addFailure);
    }

    if (component.properties && typeof component.properties === 'object' && !Array.isArray(component.properties)) {
        checkSection(componentPath, 'properties', component.properties.schema, component.properties.inspector, addFailure);
    }
}

module.exports = {
    name: 'datetime-inspector-type',
    description: 'date-time schema fields use the date-time inspector type (not text)',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
