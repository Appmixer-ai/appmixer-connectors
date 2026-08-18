'use strict';

const lib = require('../../lib');

const START_HUB_TYPES = [
    'appmixer.hubbi.core.StartHub',
    'appmixer.hubbi.core.StartHubWithData'
];

module.exports = {

    async receive(context) {

        if (context.properties.generateOutputPortOptions) {
            return generateOutputPortOptions(context);
        }

        if (context.messages.webhook) {
            const { conversionKey: configuredKey, outputType = 'object' } = context.properties;
            const payload = context.messages.webhook.content.data || {};

            if (payload.conversionKey && payload.conversionKey !== configuredKey) {
                await context.log({ step: 'Webhook ignored, conversionKey mismatch', received: payload.conversionKey, expected: configuredKey });
                return context.response();
            }

            // A hub event may carry a single record (object) or a bulk batch
            // (array). Normalize to an array of records so a bulk batch is
            // preserved instead of being spread into an object with numeric
            // keys ("0", "1", ...). lib.sendArrayOutput then emits them
            // according to the selected output type.
            const records = Array.isArray(payload.data)
                ? payload.data
                : (payload.data ? [payload.data] : []);

            // An event with no records is a no-op: there is nothing to emit, so
            // acknowledge it instead of firing the flow with an empty batch.
            if (records.length === 0) {
                await context.log({ step: 'Webhook ignored, no records in payload' });
                return context.response();
            }

            await lib.sendArrayOutput({ context, outputType, records });
            return context.response();
        }
    },

    // Flow Test Mode. HubBI pushes hub events to the webhook URL and offers no
    // endpoint to read past events, so there is no real record to fetch. The
    // output shape is fully derived from the hub's target field definitions
    // though, so we load them through the same fetchTargetFields() helper the
    // output port options use and synthesize one record from them.
    //
    // Test Mode must emit exactly one item with sendJson (not sendArrayOutput),
    // so the single-record payload lib.sendArrayOutput would build for the
    // configured output type is reproduced here: 'array' wraps the record in
    // 'result' with a count, 'object' flattens it with index + count.
    async test(context) {

        const { conversionKey, outputType = 'object' } = context.properties;

        if (!conversionKey) {
            throw new Error('No hub selected, cannot build test data.');
        }

        const fields = await fetchTargetFields(context, conversionKey);

        if (!fields.length) {
            throw new Error('The selected hub has no target fields to use as test data.');
        }

        const record = {};
        for (const field of fields) {
            if (!field.fieldId) continue;
            record[field.fieldId] = sampleValue(lib.mapFieldType(field.type).schema, field);
        }

        const payload = outputType === 'array'
            ? { result: [record], count: 1 }
            : { ...record, index: 0, count: 1 };

        return context.sendJson(payload, 'out');
    },

    async start(context) {

        const { conversionKey } = context.properties;
        if (!conversionKey) {
            throw new context.CancelError('Hub is required!');
        }

        assertNoCircularReference(context, conversionKey);

        const webhookUrl = context.getWebhookUrl();
        await context.saveState({ webhookUrl });
        await context.log({ step: 'Webhook registered', webhookUrl });
    },

    async stop(context) {

        await context.saveState({});
    }
};

// Guard against a circular reference: receiving from a hub and starting the
// same hub in one flow makes the flow trigger itself. The option lists cannot
// prevent the selection (they are resolved per component, in isolation from
// the flow), so the cycle is caught here instead and the flow refuses to
// start. A cycle spread across two separate flows is not detectable this way.
function assertNoCircularReference(context, conversionKey) {

    const flowDescriptor = context.flowDescriptor || {};

    for (const componentId of Object.keys(flowDescriptor)) {
        if (componentId === context.componentId) continue;

        const component = flowDescriptor[componentId] || {};
        if (!START_HUB_TYPES.includes(component.type)) continue;

        if (getConfiguredHubs(component).includes(conversionKey)) {
            const label = component.label || component.type.split('.').pop();
            throw new context.CancelError(
                `Circular reference: "${label}" starts the same hub this trigger receives from. ` +
                'Select a different hub in one of the two components, or move it to another flow.'
            );
        }
    }
}

// Every hub a single component is configured with. A trigger keeps its
// configuration in config.properties, while an action receives it through its
// in port, where the designer stores the resolved values per incoming
// connection under config.transform.<inPort>.<sourceId>.<sourcePort>.lambda.
// Values still carrying a mustache placeholder are mapped from a previous step
// and cannot be resolved statically, so they are skipped.
function getConfiguredHubs(component) {

    const config = component.config || {};
    const hubs = [];

    const add = value => {
        if (typeof value === 'string' && value && !value.includes('{{{')) {
            hubs.push(value);
        }
    };

    add((config.properties || {}).conversionKey);

    const transform = config.transform || {};
    for (const inPort of Object.keys(transform)) {
        const sources = transform[inPort] || {};
        for (const sourceId of Object.keys(sources)) {
            const ports = sources[sourceId] || {};
            for (const sourcePort of Object.keys(ports)) {
                add(((ports[sourcePort] || {}).lambda || {}).conversionKey);
            }
        }
    }

    return hubs;
}

// Single source of truth for the target field lookup: the output port options
// and test() both describe the same record shape, so they must read it the
// same way.
async function fetchTargetFields(context, conversionKey) {

    const baseUrl = context.auth.baseUrl.replace(/\/$/, '');
    const response = await context.httpRequest({
        method: 'GET',
        url: `${baseUrl}/Flows/Home/TargetFields?clientKey=${encodeURIComponent(context.auth.clientKey)}&conversionKey=${encodeURIComponent(conversionKey)}`,
        headers: {
            'Authorization': `Bearer ${context.auth.token}`,
            'Accept': 'application/json'
        }
    });

    return response.data || [];
}

// A plausible value for one target field, derived from the schema
// lib.mapFieldType already produces for it. Values are fixed rather than
// generated so a test run is reproducible.
function sampleValue(schema, field) {

    if (schema.type === 'integer') return 42;
    if (schema.type === 'number') return 42.5;
    if (schema.type === 'boolean') return true;
    if (schema.format === 'date-time') return '2026-01-01T09:00:00.000Z';
    if (schema.format === 'date') return '2026-01-01';
    if (schema.format === 'uuid') return '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
    return field.name || field.fieldId;
}

async function generateOutputPortOptions(context) {

    const { conversionKey, outputType = 'object' } = context.properties;

    // Build the per-record field schema. Any failure here (missing auth during
    // port generation, endpoint error, empty hub) must NOT blank out the whole
    // option list, so it is isolated in a try/catch and we fall back to the
    // generic record options that lib.getOutputPortOptions always provides.
    const itemSchema = {};

    if (conversionKey) {
        try {
            const fields = await fetchTargetFields(context, conversionKey);

            for (const field of fields) {
                if (!field.fieldId) continue;
                const { schema } = lib.mapFieldType(field.type);
                itemSchema[field.fieldId] = field.name ? { ...schema, title: field.name } : schema;
            }
        } catch (err) {
            await context.log({ step: 'Failed to load target fields for output port options', conversionKey, error: err.message });
        }
    }

    return lib.getOutputPortOptions(context, outputType, itemSchema, { label: 'Records', value: 'result' });
}
