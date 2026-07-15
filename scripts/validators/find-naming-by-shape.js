'use strict';

// What this validator checks
// --------------------------
// The inverse of find-component-standards: a component that HAS the Find shape
// must be NAMED Find*. The Find shape (07-component-types.md) is a component that
// returns a set of items:
//   1. a `notFound` output port — fired when nothing matches;
//   2. an `outputType` input — the caller chooses first / array / object / file;
//   3. at least one real search/filter input besides `outputType`
//      (e.g. search, name, query, email, status, filter).
//
// A component with all three but named Get* / List* / anything-not-Find is
// mislabelled — `Get` implies a single item by id (no outputType, no notFound),
// `List` implies the full unfiltered set. Such a component should be `Find*`.
//
// Scope: every component whose folder name does NOT start with `Find`.

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

    const name = componentName(componentPath);

    // Find* components are covered by find-component-standards; nothing to rename.
    if (/^Find/.test(name)) {
        return;
    }

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        // JSON parse errors are reported by other validators.
        return;
    }

    // Triggers are a different shape (properties, no inPorts) — never Find.
    if (component.trigger === true) {
        return;
    }

    const outPorts = Array.isArray(component.outPorts) ? component.outPorts : [];
    const hasNotFound = outPorts.map(outPortName).includes('notFound');

    const inputKeys = collectInputKeys(component);
    const hasOutputType = inputKeys.has('outputType');
    const searchInputs = [...inputKeys].filter((key) => key !== 'outputType');

    // Full Find shape: returns a filtered set (outputType) that may be empty
    // (notFound) and takes search criteria.
    if (hasNotFound && hasOutputType && searchInputs.length > 0) {
        addFailure(
            componentPath,
            `component "${name}" has the Find shape (outputType input, notFound port, ` +
            `search input${searchInputs.length > 1 ? 's' : ''} [${searchInputs.join(', ')}]) ` +
            `but is not named Find* — rename it to "Find${name.replace(/^(Get|List)/, '')}" ` +
            '(Get = single item by id, List = full unfiltered set, Find = filtered search)'
        );
    }
}

module.exports = {
    name: 'find-naming-by-shape',
    description: 'A component with the Find shape (outputType + notFound + search input) must be named Find*',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
