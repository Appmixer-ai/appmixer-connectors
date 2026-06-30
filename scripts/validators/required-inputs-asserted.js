'use strict';

// What this validator checks
// --------------------------
// Every required input declared in component.json must be validated in the
// behavior file: a missing required input should throw
//   throw new context.CancelError('<name> is required!')
// rather than letting the component proceed and fail deep inside an API call.
//
// Heuristic (deliberately coarse to keep false positives low):
//   If a component declares one or more required inputs (across
//   inPorts[*].schema.required) but its behavior file contains NO `CancelError`
//   at all, it is flagged — such a component validates nothing. Pinpointing a
//   specific assertion per field statically is unreliable, so per-field matching
//   is intentionally avoided here; the AI reviewer covers the finer cases.
//
// The behavior file is the sibling `<ComponentName>.js` next to component.json.
//
// See 06-component-behavior.md and 08-best-practices.md
// ("Component Behavior (JavaScript) Requirements").

const fs = require('fs');
const path = require('path');

const { readJson } = require('./_shared');

function componentName(componentPath) {

    return path.basename(path.dirname(componentPath));
}

function requiredInputNames(component) {

    const inPorts = Array.isArray(component.inPorts) ? component.inPorts : [];
    const names = [];

    for (const inPort of inPorts) {
        const required = inPort && inPort.schema && inPort.schema.required;
        if (Array.isArray(required)) {
            for (const name of required) {
                if (typeof name === 'string') {
                    names.push(name);
                }
            }
        }
    }

    return names;
}

function validateComponent(componentPath, addFailure) {

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    const required = requiredInputNames(component);

    if (required.length === 0) {
        return;
    }

    const dir = path.dirname(componentPath);
    const behaviorPath = path.join(dir, `${componentName(componentPath)}.js`);

    if (!fs.existsSync(behaviorPath)) {
        // Some components legitimately have no behavior file (e.g. pure config);
        // not this validator's concern.
        return;
    }

    const behavior = fs.readFileSync(behaviorPath, 'utf8');

    if (!/CancelError/.test(behavior)) {
        addFailure(componentPath, `declares required input(s) [${required.join(', ')}] but the behavior file has no context.CancelError assertion — required inputs must be validated (throw new context.CancelError('… is required!'))`);
    }
}

module.exports = {
    name: 'required-inputs-asserted',
    description: 'components with required inputs assert them via context.CancelError in the behavior file',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
