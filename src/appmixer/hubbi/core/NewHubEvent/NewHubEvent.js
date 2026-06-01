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
            const payload = context.messages.webhook.content.data || {};
            const { conversionKey: configuredKey } = context.properties;

            if (payload.conversionKey && payload.conversionKey !== configuredKey) {
                await context.log({ step: 'Webhook ignored, conversionKey mismatch', received: payload.conversionKey, expected: configuredKey });
                return context.response();
            }

            // A hub event may carry a single record (object) or a bulk batch
            // (array). Always expose the records as an array under `result` so
            // a bulk batch is preserved as an array instead of being spread
            // into an object with numeric keys ("0", "1", ...).
            const records = Array.isArray(payload.data)
                ? payload.data
                : (payload.data ? [payload.data] : []);

            await context.sendJson(
                { conversionKey: payload.conversionKey, result: records, count: records.length },
                'out'
            );
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

    const { conversionKey } = context.properties;

    const itemProperties = {};

    if (conversionKey) {
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
            itemProperties[field.fieldId] = schema;
        }
    }

    const options = [
        { label: 'Conversion Key', value: 'conversionKey', schema: { type: 'string' } },
        {
            label: 'Records',
            value: 'result',
            schema: {
                type: 'array',
                items: { type: 'object', properties: itemProperties }
            }
        },
        { label: 'Items Count', value: 'count', schema: { type: 'integer' } }
    ];

    return context.sendJson(options, 'out');
}
