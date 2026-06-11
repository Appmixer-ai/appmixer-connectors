'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (context.properties.generateInspector) {
            return context.sendJson({
                inputs: {
                    webhookUrl: {
                        label: 'Webhook URL',
                        type: 'text',
                        readonly: true,
                        defaultValue: context.getWebhookUrl(),
                        value: context.getWebhookUrl(),
                        tooltip: 'Configure this URL in Hubbi to send hub events to this trigger.'
                    }
                }
            }, 'out');
        }

        if (context.properties.generateOutputPortOptions) {
            return generateOutputPortOptions(context);
        }

        if (context.messages.webhook) {
            const { conversionKey: configuredKey, outputType = 'array' } = context.properties;
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

            await lib.sendArrayOutput({ context, outputType, records });
            return context.response();
        }
    },

    async start(context) {

        const { conversionKey } = context.properties;
        if (!conversionKey) {
            throw new context.CancelError('Hub is required!');
        }

        const webhookUrl = context.getWebhookUrl();
        await context.saveState({ webhookUrl });
        await context.log({ step: 'Webhook registered', webhookUrl });
    },

    async stop(context) {

        await context.saveState({});
    }
};

async function generateOutputPortOptions(context) {

    const { conversionKey, outputType = 'array' } = context.properties;

    // Build the per-record field schema. Any failure here (missing auth during
    // port generation, endpoint error, empty hub) must NOT blank out the whole
    // option list, so it is isolated in a try/catch and we fall back to the
    // generic record options that lib.getOutputPortOptions always provides.
    const itemSchema = {};

    if (conversionKey) {
        try {
            const baseUrl = context.auth.baseUrl.replace(/\/$/, '');
            const response = await context.httpRequest({
                method: 'GET',
                url: `${baseUrl}/Flows/Home/TargetFields?clientKey=${encodeURIComponent(context.auth.clientKey)}&conversionKey=${encodeURIComponent(conversionKey)}`,
                headers: {
                    'Authorization': `Bearer ${context.auth.token}`,
                    'Accept': 'application/json'
                }
            });

            const fields = response.data || [];

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
