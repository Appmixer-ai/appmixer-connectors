'use strict';

// What this validator checks
// --------------------------
// Each output port must define its structure using EITHER `schema` OR `options`,
// but not both. JSON Schema (`schema`) is preferred; `options` is the older
// label/value form. Declaring both is contradictory — the engine/variable
// picker can only honour one and the other silently rots.
//
// String-form outPorts (e.g. "out") and ports with a dynamic `source` are not
// flagged here; this validator only guards the static schema-vs-options choice.
//
// See 05-component-config.md § "Output Port Schema Definition".

const { readJson } = require('./_shared');

function validateComponent(componentPath, addFailure) {

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    const outPorts = Array.isArray(component.outPorts) ? component.outPorts : [];

    for (let index = 0; index < outPorts.length; index++) {
        const outPort = outPorts[index];

        if (!outPort || typeof outPort !== 'object' || Array.isArray(outPort)) {
            continue;
        }

        const hasSchema = Object.prototype.hasOwnProperty.call(outPort, 'schema');
        const hasOptions = Object.prototype.hasOwnProperty.call(outPort, 'options');

        if (hasSchema && hasOptions) {
            const portName = outPort.name ? `(${outPort.name})` : '';
            addFailure(componentPath, `outPorts[${index}]${portName} declares both "schema" and "options" — use one or the other (schema preferred), not both`);
        }
    }
}

module.exports = {
    name: 'outport-schema-xor-options',
    description: 'each outPort uses either schema or options, not both',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
