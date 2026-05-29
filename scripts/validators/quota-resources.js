'use strict';

// What this validator checks
// --------------------------
// For every `component.json` under src/appmixer that declares a `quota` block:
//   1. `quota.resources` (string or string[]) is non-empty AND `quota.manager` is set.
//   2. `quota.manager` follows the `appmixer:<connector>[:<sub>...]` pattern and
//      maps to a real `quota.js` file (e.g. `appmixer:google:gmail` →
//      `src/appmixer/google/gmail/quota.js`).
//   3. The referenced `quota.js` loads via `require()` and exports `rules: []`.
//   4. Every resource name in `quota.resources` is declared as a `rule.resource`
//      in that `quota.js`.
//
// Why
// ---
// Quota rules gate API calls (rate limits, daily caps, user-level throttles).
// A typo in `quota.resources` silently disables the limiter for that component —
// it doesn't fail at runtime, the call just runs unlimited. CI must catch the
// mismatch.

const fs = require('fs');
const path = require('path');

const { readJson } = require('./_shared');

function getQuotaResources(quotaPath, addFailure) {

    try {
        delete require.cache[require.resolve(quotaPath)];
        const quotaModule = require(quotaPath);
        const rules = Array.isArray(quotaModule && quotaModule.rules) ? quotaModule.rules : [];

        return new Set(
            rules
                .map((rule) => rule && rule.resource)
                .filter((resource) => typeof resource === 'string' && resource.length > 0)
        );
    } catch (error) {
        addFailure(quotaPath, `failed to load quota file: ${error.message}`);
        return null;
    }
}

function managerToQuotaPath(connectorsRoot, manager) {

    if (typeof manager !== 'string' || !manager.startsWith('appmixer:')) {
        return null;
    }

    const managerParts = manager.split(':').slice(1);
    return path.join(connectorsRoot, ...managerParts, 'quota.js');
}

function normalizeQuotaResources(resources) {

    if (typeof resources === 'string') {
        return [resources];
    }

    if (Array.isArray(resources)) {
        return resources.filter((resource) => typeof resource === 'string' && resource.length > 0);
    }

    return [];
}

function validateComponent(componentPath, context) {

    const { addFailure, connectorsRoot, relativePath } = context;

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    const quota = component.quota;

    if (!quota || typeof quota !== 'object' || Array.isArray(quota)) {
        return;
    }

    const resources = normalizeQuotaResources(quota.resources);

    if (resources.length === 0) {
        return;
    }

    if (!quota.manager) {
        addFailure(componentPath, `quota.resources references ${resources.join(', ')} but quota.manager is missing`);
        return;
    }

    const quotaPath = managerToQuotaPath(connectorsRoot, quota.manager);

    if (!quotaPath) {
        addFailure(componentPath, `unsupported quota manager '${quota.manager}'`);
        return;
    }

    if (!fs.existsSync(quotaPath)) {
        addFailure(componentPath, `quota manager '${quota.manager}' points to missing file ${relativePath(quotaPath)}`);
        return;
    }

    const knownResources = getQuotaResources(quotaPath, addFailure);

    if (!knownResources) {
        return;
    }

    for (const resource of resources) {
        if (!knownResources.has(resource)) {
            addFailure(componentPath, `quota resource '${resource}' is not defined in ${relativePath(quotaPath)}`);
        }
    }
}

module.exports = {
    name: 'quota-resources',
    description: 'component.json quota.resources are declared in the referenced quota.js',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context);
        }
    }
};
