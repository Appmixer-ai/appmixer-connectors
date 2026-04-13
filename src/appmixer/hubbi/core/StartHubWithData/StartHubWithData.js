'use strict';

module.exports = {

    async receive(context) {

        if (context.properties.generateInspector) {
            return generateInspector(context);
        }

        const { conversionKey, ...data } = context.messages.in.content;

        if (!conversionKey) {
            throw new context.CancelError('Conversion Key is required!');
        }

        const baseUrl = context.auth.baseUrl.replace(/\/$/, '');
        await context.httpRequest({
            method: 'POST',
            url: `${baseUrl}/Flows/Home/HubsStartWithData?clientKey=${encodeURIComponent(context.auth.clientKey)}&conversionKey=${encodeURIComponent(conversionKey)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data
        });

        return context.sendJson({ conversionKey }, 'out');
    }
};

async function generateInspector(context) {

    const { conversionKey } = context.properties;

    const schema = {
        type: 'object',
        properties: {
            conversionKey: { type: 'string' }
        },
        required: ['conversionKey']
    };

    let fieldsInputs = {};

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

        fieldsInputs = fields.reduce((res, field, index) => {
            schema.properties[field.fieldId] = { type: 'string' };
            res[field.fieldId] = {
                type: 'text',
                label: field.name || field.fieldId,
                tooltip: `Source field: ${field.name || field.fieldId} (${field.type || 'string'})`,
                index: index + 1
            };
            return res;
        }, {});
    }

    const inputs = {
        conversionKey: {
            type: 'select',
            label: 'Conversion Key',
            tooltip: 'The conversion identifier (UUID) of the hub to start.',
            index: 0,
            source: {
                url: '/component/appmixer/hubbi/core/ListHubs?outPort=out',
                data: {
                    messages: {
                        'in/outputType': 'array'
                    },
                    transform: './ListHubs#toSelectArray'
                }
            }
        },
        ...fieldsInputs
    };

    return context.sendJson({ schema, inputs, groups: {
        required: {
            label: 'Hub',
            index: 1,
            fields: ['conversionKey']
        },
        sourceFields: {
            label: 'Source Fields',
            index: 2,
            fields: Object.keys(fieldsInputs)
        }
    } }, 'out');
}
