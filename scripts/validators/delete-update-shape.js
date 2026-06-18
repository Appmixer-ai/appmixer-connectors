'use strict';

// What this validator checks
// --------------------------
// Delete* and Update* components operate on an existing entity, so they must
// take the entity's ID as a required input. Delete* additionally must expose a
// single "out" port (it returns an empty object, so no typed schema is needed).
//
// Failures:
//   - Delete*: outPorts must be exactly one port named "out".
//   - Delete* / Update*: must declare at least one required input (the entity ID)
//     across inPorts[*].schema.required.
//
// See 08-best-practices.md ("component.json Requirements").

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

function countRequiredInputs(component) {

    const inPorts = Array.isArray(component.inPorts) ? component.inPorts : [];
    let count = 0;

    for (const inPort of inPorts) {
        const required = inPort && inPort.schema && inPort.schema.required;
        if (Array.isArray(required)) {
            count += required.length;
        }
    }

    return count;
}

function validateComponent(componentPath, addFailure) {

    const name = componentName(componentPath);
    // Negative lookahead excludes past-tense trigger names (Deleted*, Updated*),
    // which are event triggers — not Delete/Update actions.
    const isDelete = /^Delete(?!d)/.test(name);
    const isUpdate = /^Update(?!d)/.test(name);

    if (!isDelete && !isUpdate) {
        return;
    }

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    if (countRequiredInputs(component) === 0) {
        const kind = isDelete ? 'Delete' : 'Update';
        addFailure(componentPath, `${kind} component must declare at least one required input (the ID of the entity being ${isDelete ? 'deleted' : 'updated'})`);
    }

    if (isDelete) {
        const outPorts = Array.isArray(component.outPorts) ? component.outPorts : [];
        const names = outPorts.map(outPortName);

        if (names.length !== 1 || names[0] !== 'out') {
            addFailure(componentPath, `Delete component must have a single output port named "out" (found ${JSON.stringify(names)})`);
        }
    }
}

module.exports = {
    name: 'delete-update-shape',
    description: 'Delete* has outPorts:[out]; Delete*/Update* declare a required ID input',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
