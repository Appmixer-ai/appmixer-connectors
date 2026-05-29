'use strict';

// What this validator checks
// --------------------------
// For every outPort in every component.json under src/appmixer:
//   - JSON Schema form (`outPort.schema`): the schema is satisfied if
//     EITHER
//       (a) the schema (or any ancestor schema) carries an `example`
//           value — a whole-object sample covers everything beneath it
//           (the form used by e.g. todoist/CreateTask), OR
//       (b) every leaf property in `schema.properties` (recursively)
//           has its own `example` value.
//     Object properties with nested `properties` are not leaves — they
//     are descended into; their inner leaves carry the examples (unless
//     the parent already has a covering whole-object example).
//   - Options form (`outPort.options[]`): every option's `schema` must
//     have an `example` value.
//   - Skipped: ports with `source` (dynamic, runtime-generated), ports
//     with no schema/options (typically `notFound` / error ports),
//     schemas using `oneOf` / `anyOf` (consistent with the inspector
//     validator), and `MakeApiCall` components (generic API-call helper
//     whose output shape depends on the user-supplied endpoint and so
//     cannot have meaningful static examples).
//   - The check uses `'example' in prop`, not a truthiness test, so
//     legitimate falsy examples (`0`, `false`, `""`) count as present.
//
// Why
// ---
// Output port `example` values populate the variable picker preview in
// the Designer UI. Without them downstream components are wired blindly
// and authors can't tell what data shape will arrive at runtime.
// Appmixer-core#3734 fixed rendering of `schema.properties[key].example`
// in the JSON Schema form, so there is no engine-level reason left for
// new components to ship without per-leaf examples.

const path = require('path');

const { readJson } = require('./_shared');

function isMakeApiCallComponent(componentPath) {

    // Path ends with /MakeApiCall/component.json — these are generic API helpers
    // whose output shape is decided at runtime by the user's endpoint choice.
    return path.basename(path.dirname(componentPath)) === 'MakeApiCall';
}

function hasUnsupportedSchemaExpression(schema) {

    if (!schema || typeof schema !== 'object') {
        return false;
    }

    return Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf);
}

function isObjectWithNestedProperties(prop) {

    if (!prop || typeof prop !== 'object') {
        return false;
    }

    if (prop.type !== 'object') {
        return false;
    }

    const nested = prop.properties;
    return !!nested && typeof nested === 'object' && !Array.isArray(nested);
}

function findMissingExamples(schema, basePath = []) {

    const missing = [];

    if (!schema || typeof schema !== 'object') {
        return missing;
    }

    // A whole-object `example` at this level covers everything beneath it.
    if ('example' in schema) {
        return missing;
    }

    const properties = schema.properties;

    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
        return missing;
    }

    for (const [key, prop] of Object.entries(properties)) {
        if (!prop || typeof prop !== 'object') continue;

        const path = [...basePath, key];

        if (isObjectWithNestedProperties(prop)) {
            missing.push(...findMissingExamples(prop, path));
            continue;
        }

        if (!('example' in prop)) {
            missing.push(path.join('.'));
        }
    }

    return missing;
}

function validateOutPort(componentPath, outPort, portLocation, addFailure) {

    if (outPort.source) {
        return;
    }

    if (outPort.schema) {
        if (hasUnsupportedSchemaExpression(outPort.schema)) {
            return;
        }

        const missing = findMissingExamples(outPort.schema);

        for (const path of missing) {
            addFailure(componentPath, `${portLocation} schema.properties.${path} is missing 'example'`);
        }

        return;
    }

    if (Array.isArray(outPort.options)) {
        for (let index = 0; index < outPort.options.length; index++) {
            const option = outPort.options[index];

            if (!option || typeof option !== 'object') {
                continue;
            }

            const label = option.value || `index ${index}`;

            if (!option.schema || typeof option.schema !== 'object') {
                addFailure(componentPath, `${portLocation} options[${label}] has no 'schema' (and therefore no 'example')`);
                continue;
            }

            if (!('example' in option.schema)) {
                addFailure(componentPath, `${portLocation} options[${label}].schema is missing 'example'`);
            }
        }
    }
}

function validateComponent(componentPath, addFailure) {

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

    const outPorts = Array.isArray(component.outPorts) ? component.outPorts : [];

    for (let index = 0; index < outPorts.length; index++) {
        const port = outPorts[index];

        if (!port || typeof port !== 'object') {
            continue;
        }

        const portLocation = `outPorts[${index}](${port.name || index})`;
        validateOutPort(componentPath, port, portLocation, addFailure);
    }
}

module.exports = {
    name: 'output-port-examples',
    description: 'every outPort leaf (schema.properties.* or options[k].schema) has an example value',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
