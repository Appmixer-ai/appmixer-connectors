'use strict';

// What this validator checks
// --------------------------
// Find* components search for entities and may match zero, one, or many items.
// The standard shape (07-component-types.md) requires:
//   1. a `notFound` output port — fired when nothing matches;
//   2. an `outputType` input — Find returns a set, so the caller must choose
//      first / array / object / file;
//   3. at least one real search input besides `outputType` — the criteria to
//      search by.
//
// Scope: components whose folder name starts with `Find`.

const path = require('path');

const { readJson } = require('./_shared');

function componentName(componentPath) {

    return path.basename(path.dirname(componentPath));
}

function outPortName(port) {

    if (typeof port === 'string') return port;
    if (port && typeof port === 'object') return port.name;
    return undefined;
}

function collectInputKeys(component) {

    const keys = new Set();
    const inPorts = Array.isArray(component.inPorts) ? component.inPorts : [];

    for (const inPort of inPorts) {
        const props = inPort && inPort.schema && inPort.schema.properties;
        if (props && typeof props === 'object' && !Array.isArray(props)) {
            for (const key of Object.keys(props)) {
                keys.add(key);
            }
        }
        const inputs = inPort && inPort.inspector && inPort.inspector.inputs;
        if (inputs && typeof inputs === 'object' && !Array.isArray(inputs)) {
            for (const key of Object.keys(inputs)) {
                keys.add(key);
            }
        }
    }

    return keys;
}

function validateComponent(componentPath, addFailure) {

    if (!/^Find/.test(componentName(componentPath))) {
        return;
    }

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    // 1. notFound output port
    const outPorts = Array.isArray(component.outPorts) ? component.outPorts : [];
    const outNames = outPorts.map(outPortName);

    if (!outNames.includes('notFound')) {
        addFailure(componentPath, `Find component must have a "notFound" output port for when no items match (found ports ${JSON.stringify(outNames)})`);
    }

    // 2 & 3. outputType input + at least one search input
    const inputKeys = collectInputKeys(component);

    if (!inputKeys.has('outputType')) {
        addFailure(componentPath, 'Find component must declare an "outputType" input (Find returns a set: first / array / object / file)');
    }

    const searchInputs = [...inputKeys].filter((key) => key !== 'outputType');

    if (searchInputs.length === 0) {
        addFailure(componentPath, 'Find component must have at least one search input besides "outputType"');
    }
}

module.exports = {
    name: 'find-component-standards',
    description: 'Find* components have a notFound port, an outputType input, and a search input',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
