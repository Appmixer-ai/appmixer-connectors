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

    // Flow Test Mode. HubBI delivers hub events by pushing them to the webhook
    // URL and exposes no endpoint for reading past events, so there is no real
    // record to fetch and no honest example to emit. Throwing is the correct
    // answer: the engine logs it and falls through to its own fallbacks, and the
    // user is told how to produce real data instead.
    //
    // This deliberately does NOT synthesize a record out of the hub's target
    // field definitions. Fabricated values would make the test pass while
    // testing nothing, and emit a shape that matches no real run - downstream
    // components would be configured against data that never arrives.
    async test(context) {

        throw new context.CancelError(
            'HubBI has no endpoint for reading past hub events, so no real example can be fetched. ' +
            'Start the flow and send data from the selected hub in HubBI to see the actual output.'
        );
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

// The target field definitions describe the shape of one record, which is what
// the output port options are built from. Uncached on purpose: this runs behind
// generateOutputPortOptions, which the designer resolves once per inspector open
// rather than in the concurrent burst the hub dropdowns produce.
async function fetchTargetFields(context, conversionKey) {

    const response = await lib.apiGet(context, lib.apiUrl(
        context,
        `/Flows/Home/TargetFields?clientKey=${encodeURIComponent(context.auth.clientKey)}` +
        `&conversionKey=${encodeURIComponent(conversionKey)}`
    ));

    return response.data || [];
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
