'use strict';

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

            const data = payload.data || {};

            await context.sendJson({ conversionKey: payload.conversionKey, ...data }, 'out');
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

    const options = [
        { label: 'Conversion Key', value: 'conversionKey', schema: { type: 'string' } }
    ];

    if (conversionKey) {
        const baseUrl = context.auth.baseUrl.replace(/\/$/, '');
        const response = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/Flows/Home/SourceFields?clientKey=${encodeURIComponent(context.auth.clientKey)}&conversionKey=${encodeURIComponent(conversionKey)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.token}`,
                'Accept': 'application/json'
            }
        });

        const fields = response.data || [];

        for (const field of fields) {
            options.push({
                label: field.name || field.fieldId,
                value: field.fieldId,
                schema: { type: 'string' }
            });
        }
    }

    return context.sendJson(options, 'out');
}
