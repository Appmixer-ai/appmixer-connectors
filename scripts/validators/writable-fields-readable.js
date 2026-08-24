'use strict';

// What this validator checks
// --------------------------
// A field a user can WRITE should be a field they can READ BACK. For every
// Create<Entity> / Update<Entity> component this validator finds the matching
// reader — Get<Entity>, or the writer's own `out` port when it returns the
// created entity — and reports inputs that have no counterpart in the reader's
// output schema.
//
// Why
// ---
// Such a field is write-only from the flow author's point of view: the inspector
// offers it, the API stores it, and the variable picker never shows it again, so
// nothing downstream can branch on what was just written. Nothing else catches
// this. The field is spelled correctly and carries a valid schema, so the static
// validators are happy; and E2E flows only assert the two or three fields the
// flow author happened to pick. Real case: cliniko Create Patient accepted
// `medicare` and the Patient output never returned it.
//
// WARNING, not a failure
// ----------------------
// Reported through addWarning because the input and output sides of an API
// legitimately differ in shape, and the heuristic below cannot always tell that
// apart from a genuine gap. Measured over this repo, roughly half of the reports
// are structural rather than bugs:
//
//   - several inputs composing one output structure
//     (todoist dueString/dueDate/dueDatetime -> due, cliniko phoneNumber ->
//     patient_phone_numbers[])
//   - request-scoping parameters that are not entity fields at all
//     (googleAds customerId / loginCustomerId)
//   - nested output objects (agentcore codeS3Bucket -> artifact.code.s3)
//
// So this is a prompt to look, not a verdict — which is also why it carries no
// threshold entry. Treat a report as a question: "can a flow read this back?"
//
// Heuristic
// ---------
// An input is considered readable when the reader's output declares a key that
// matches it after case/underscore normalisation, OR a key that contains it or
// is contained by it (so `deal_name` -> `name` and `dueString` -> `due` are both
// accepted as the same datum under another name). Only inputs with no plausible
// relative at all are reported.
//
// Skipped: control inputs (outputType, isSource, paging/include flags), the
// entity's own identifier on Update*, and readers whose `out` port is dynamic
// (a `source` block) or declares no properties — there is no contract to compare.

const path = require('path');

const { readJson } = require('./_shared');

// Inputs that steer the component rather than describe the entity.
const CONTROL_INPUTS = new Set([
    'outputtype', 'issource', 'variablefetch', 'generateoutputportoptions',
    'limit', 'offset', 'page', 'perpage', 'dummy',
    'includearchived', 'includedeleted', 'includecancelled', 'includeinactive'
]);

function normalize(key) {

    return key
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/_/g, '');
}

function componentName(componentPath) {

    return path.basename(path.dirname(componentPath));
}

function moduleDir(componentPath) {

    return path.dirname(path.dirname(componentPath));
}

/**
 * Every declared field name in an output schema, including the ones nested inside
 * object properties and array items — cliniko's phoneType lives in
 * patient_phone_numbers[].phone_type, and it is readable from there.
 * @param {object} properties
 * @param {Array<string>} [acc]
 * @returns {Array<string>}
 */
function collectKeys(properties, acc = []) {

    for (const [key, schema] of Object.entries(properties)) {
        acc.push(key);
        if (!schema || typeof schema !== 'object') continue;

        if (schema.properties && typeof schema.properties === 'object') {
            collectKeys(schema.properties, acc);
        }
        const items = schema.items;
        if (items && typeof items === 'object' && items.properties) {
            collectKeys(items.properties, acc);
        }
    }

    return acc;
}

function outputProperties(component) {

    const outPorts = Array.isArray(component.outPorts) ? component.outPorts : [];
    const out = outPorts.find((port) => port && port.name === 'out');

    // A dynamic port (source) has no static contract to compare against.
    if (!out || out.source) {
        return null;
    }

    const properties = out.schema && out.schema.properties;

    if (properties && Object.keys(properties).length > 0) {
        return collectKeys(properties);
    }

    // The options form carries the field names in `value`.
    if (Array.isArray(out.options) && out.options.length > 0) {
        const keys = [];
        for (const option of out.options) {
            if (!option) continue;
            if (option.value) keys.push(option.value);
            const nested = option.schema && (option.schema.properties
                || (option.schema.items && option.schema.items.properties));
            if (nested) collectKeys(nested, keys);
        }
        return keys.length > 0 ? keys : null;
    }

    return null;
}

function inputProperties(component) {

    const inPorts = Array.isArray(component.inPorts) ? component.inPorts : [];
    const port = inPorts[0];
    const properties = port && port.schema && port.schema.properties;

    return properties && typeof properties === 'object' ? Object.keys(properties) : [];
}

function isReadable(input, readableKeys) {

    const target = normalize(input);

    if (target.length < 3) {
        return true;
    }

    return readableKeys.some((key) => {
        const candidate = normalize(key);
        if (candidate.length < 3) return false;
        return candidate === target || candidate.includes(target) || target.includes(candidate);
    });
}

/**
 * Does the connector offer any way to read this entity back?
 * @param {string} entity - the noun from Create<Entity> / Update<Entity>
 * @param {Map<string, object>} siblings - components in the same module
 * @returns {boolean}
 */
function isRetrievableEntity(entity, siblings) {

    const plural = /s$/.test(entity) ? entity : `${entity}s`;
    const candidates = [
        `Get${entity}`,
        `Find${entity}`, `Find${plural}`,
        `List${entity}`, `List${plural}`
    ];

    return candidates.some((candidate) => siblings.has(candidate));
}

function validateComponent(componentPath, byModule, addWarning) {

    const name = componentName(componentPath);
    const match = name.match(/^(Create|Update)(.+)$/);

    if (!match) {
        return;
    }

    const entity = match[2];
    const siblings = byModule.get(moduleDir(componentPath));
    if (!siblings) return;

    const writer = siblings.get(name);
    if (!writer) return;

    // Only entities the connector can also retrieve. Without a Get/Find/List sibling
    // this is not entity CRUD but an operation that happens to be named Create* —
    // ai/openai CreateSpeech, ai/groq CreateTranscription — where the inputs are
    // parameters (model, voice, temperature) and the output is a result, not an echo.
    // "Readable back" is meaningless there.
    if (!isRetrievableEntity(entity, siblings)) {
        return;
    }

    // Prefer the dedicated reader; fall back to the writer's own output when it
    // returns the entity it just created.
    const readerName = siblings.has(`Get${entity}`) ? `Get${entity}` : name;
    const readableKeys = outputProperties(siblings.get(readerName));

    if (!readableKeys) {
        return;
    }

    const writeOnly = inputProperties(writer).filter((input) => {
        const lower = input.toLowerCase();
        if (CONTROL_INPUTS.has(lower)) return false;
        // The input that addresses the record is not a field of it: Update<Entity> takes
        // <entity>Id (productId, product_id) or just <entity> (github UpdateIssue's
        // `issue`), while the output calls it `id`.
        const flat = normalize(input);
        const entityFlat = normalize(entity);
        if (flat === 'id' || flat === entityFlat || flat === `${entityFlat}id`) return false;
        return !isReadable(input, readableKeys);
    });

    if (writeOnly.length > 0) {
        addWarning(
            componentPath,
            `input(s) with no counterpart in ${readerName}'s output — a flow can set them but never read them back: ${writeOnly.join(', ')}`
        );
    }
}

module.exports = {
    name: 'writable-fields-readable',
    description: 'fields accepted by Create*/Update* are readable back from the matching Get*/output schema',
    run(context) {

        // Index components by module so a writer can find its reader.
        const byModule = new Map();

        for (const componentPath of context.componentFiles) {
            let component;
            try {
                component = readJson(componentPath);
            } catch (error) {
                continue;
            }
            const dir = moduleDir(componentPath);
            if (!byModule.has(dir)) byModule.set(dir, new Map());
            byModule.get(dir).set(componentName(componentPath), component);
        }

        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, byModule, context.addWarning);
        }
    }
};
