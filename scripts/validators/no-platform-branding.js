'use strict';

// What this validator checks
// --------------------------
// For every component.json under src/appmixer, no USER-FACING text may
// mention the platform brand "Appmixer". Appmixer is a whitelabel
// platform: connectors are rendered inside customers' rebranded
// instances, so any hardcoded "Appmixer" in the Designer UI leaks the
// upstream brand ("store as an Appmixer file" on a customer's
// "AcmeFlow" instance).
//
// User-facing text = string values of these keys, anywhere in the
// document (inspector inputs, port schemas, options, nested groups):
//   - label        (inspector inputs, select options, port options)
//   - tooltip      (inspector inputs)
//   - description  (component description, schema descriptions)
//   - title        (JSON Schema titles shown in the variable picker)
//
// Technical identifiers are NOT flagged: `name`
// ("appmixer.slack.core.X"), `auth.service` / `quota.manager`
// ("appmixer:slack"), `format` ("appmixer-file-id"), variable paths and
// URLs live under other keys and stay untouched.

const { readJson } = require('./_shared');

const USER_FACING_KEYS = new Set(['label', 'tooltip', 'description', 'title']);
const BRAND_PATTERN = /appmixer/i;

function findBrandMentions(node, jsonPath, hits) {

    if (Array.isArray(node)) {
        node.forEach((item, index) => findBrandMentions(item, `${jsonPath}[${index}]`, hits));
        return;
    }

    if (!node || typeof node !== 'object') {
        return;
    }

    for (const [key, value] of Object.entries(node)) {
        const valuePath = jsonPath ? `${jsonPath}.${key}` : key;

        if (typeof value === 'string') {
            if (USER_FACING_KEYS.has(key) && BRAND_PATTERN.test(value)) {
                hits.push({ path: valuePath, value });
            }
            continue;
        }

        findBrandMentions(value, valuePath, hits);
    }
}

function validateComponent(componentPath, addFailure) {

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    const hits = [];
    findBrandMentions(component, '', hits);

    for (const hit of hits) {
        const preview = hit.value.length > 80 ? `${hit.value.slice(0, 77)}...` : hit.value;
        addFailure(componentPath, `${hit.path} mentions the platform brand ("${preview}") — Appmixer is whitelabel, use neutral wording (e.g. "file" instead of "Appmixer file")`);
    }
}

module.exports = {
    name: 'no-platform-branding',
    description: 'user-facing texts in component.json (label/tooltip/description/title) must not mention "Appmixer" (whitelabel platform)',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
