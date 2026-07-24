'use strict';

// What this validator checks
// --------------------------
// For every component.json under src/appmixer: an inspector input (inPorts
// inspector or properties inspector) that has a dynamic `source` block must
// NOT declare `type: "select"`.
//
// Why
// ---
// The dropdown source can fail (auth not yet established, dependency input
// empty, API down) and legitimately return []. `select` constrains the field
// to the dropdown options only, so the user is trapped with no way to enter
// the value manually. `type: "text"` with a `source` block renders as a
// typeahead/autocomplete: the user can pick from the loaded options OR type
// any value. See .github/instructions/07-component-types.md ("Dynamic
// dropdowns must stay editable").
//
// `multiselect` is exempt — there is no free-text multi-value alternative.

const { readJson } = require('./_shared');

function checkInspector(componentPath, inspector, where, addFailure) {

    const inputs = inspector && inspector.inputs;
    if (!inputs || typeof inputs !== 'object') return;

    for (const [name, input] of Object.entries(inputs)) {
        if (!input || typeof input !== 'object') continue;
        if (input.source && input.type === 'select') {
            addFailure(componentPath,
                `${where}.inspector.inputs.${name} is type "select" with a dynamic source — ` +
                'use type "text" (typeahead) so the user can enter the value manually when the source fails or returns []');
        }
    }
}

module.exports = {
    name: 'no-select-with-source',
    description: 'inspector inputs with a dynamic source must be type "text" (typeahead), not "select" — select traps the user when the source returns []',
    run(context) {
        for (const componentPath of context.componentFiles) {
            let component;
            try {
                component = readJson(componentPath);
            } catch (error) {
                context.addFailure(componentPath, `failed to parse JSON: ${error.message}`);
                continue;
            }

            const inPorts = Array.isArray(component.inPorts) ? component.inPorts : [];
            for (let i = 0; i < inPorts.length; i++) {
                const port = inPorts[i];
                if (port && typeof port === 'object' && port.inspector) {
                    checkInspector(componentPath, port.inspector, `inPorts[${i}](${port.name || i})`, context.addFailure);
                }
            }
            if (component.properties && component.properties.inspector) {
                checkInspector(componentPath, component.properties.inspector, 'properties', context.addFailure);
            }
        }
    }
};
