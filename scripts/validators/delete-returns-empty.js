'use strict';

// What this validator checks
// --------------------------
// Delete* components must return an empty object on the "out" port:
//   return context.sendJson({}, 'out');
// They confirm a deletion; there is no entity payload to return.
//
// Scope: components whose folder name starts with `Delete` but NOT `Deleted`
// (the negative lookahead excludes `Deleted*` event triggers). The sibling
// behavior file `<ComponentName>.js` must contain a `sendJson({}, 'out')` call.
//
// See 08-best-practices.md ("Component Behavior (JavaScript) Requirements").

const fs = require('fs');
const path = require('path');

function componentName(componentPath) {

    return path.basename(path.dirname(componentPath));
}

// Matches: sendJson ( {} , 'out' )  with arbitrary whitespace and ' or " quotes.
const EMPTY_OUT_RETURN = /sendJson\(\s*\{\s*\}\s*,\s*['"]out['"]\s*\)/;

function validateComponent(componentPath, addFailure) {

    const name = componentName(componentPath);

    if (!/^Delete(?!d)/.test(name)) {
        return;
    }

    const behaviorPath = path.join(path.dirname(componentPath), `${name}.js`);

    if (!fs.existsSync(behaviorPath)) {
        addFailure(componentPath, `Delete component is missing its behavior file ${name}.js`);
        return;
    }

    const behavior = fs.readFileSync(behaviorPath, 'utf8');

    if (!EMPTY_OUT_RETURN.test(behavior)) {
        addFailure(componentPath, `Delete component must return an empty object: context.sendJson({}, 'out') — not found in ${name}.js`);
    }
}

module.exports = {
    name: 'delete-returns-empty',
    description: 'Delete* behavior returns context.sendJson({}, \'out\')',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
