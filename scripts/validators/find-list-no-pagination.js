'use strict';

// What this validator checks
// --------------------------
// Find* and List* components must NOT declare `limit` or `offset` inputs.
// Appmixer does not support these pagination controls on Find/List components;
// the component must instead use the maximum page size the API offers and note
// the cap in its description.
//
// Checked locations (any hit is a failure):
//   - inPorts[i].schema.properties.{limit,offset}
//   - inPorts[i].inspector.inputs.{limit,offset}
//
// Why
// ---
// A `limit`/`offset` input on a Find/List component is silently ineffective at
// runtime and misleads flow authors into thinking pagination is configurable.
// See 08-best-practices.md ("Pagination Fields") and 07-component-types.md.

const path = require('path');

const { readJson } = require('./_shared');

const FORBIDDEN = ['limit', 'offset'];

function componentName(componentPath) {

    return path.basename(path.dirname(componentPath));
}

function isFindOrList(name) {

    return /^Find/.test(name) || /^List/.test(name);
}

function checkBag(componentPath, location, bag, addFailure) {

    if (!bag || typeof bag !== 'object' || Array.isArray(bag)) {
        return;
    }

    for (const field of FORBIDDEN) {
        if (Object.prototype.hasOwnProperty.call(bag, field)) {
            addFailure(componentPath, `${location}.${field} is not allowed on Find/List components — pagination is handled internally using the API's max page size (see 08-best-practices.md)`);
        }
    }
}

function validateComponent(componentPath, addFailure) {

    if (!isFindOrList(componentName(componentPath))) {
        return;
    }

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
        const props = inPort.schema && inPort.schema.properties;
        const inputs = inPort.inspector && inPort.inspector.inputs;

        checkBag(componentPath, `inPorts[${index}].schema.properties`, props, addFailure);
        checkBag(componentPath, `inPorts[${index}].inspector.inputs`, inputs, addFailure);
    }
}

module.exports = {
    name: 'find-list-no-pagination',
    description: 'Find/List components must not declare limit or offset inputs',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
