'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (context.properties.generateInspector) {
            return generateInspector(context);
        }

        const { conversionKey, records } = context.messages.in.content;

        if (!conversionKey) {
            throw new context.CancelError('Conversion Key is required!');
        }

        const rows = Array.isArray(records?.ADD) ? records.ADD : [];

        if (rows.length === 0) {
            throw new context.CancelError('At least one record is required!');
        }

        const baseUrl = context.auth.baseUrl.replace(/\/$/, '');
        try {
            await context.httpRequest({
                method: 'POST',
                url: `${baseUrl}/Flows/Home/HubsStartWithData?clientKey=${encodeURIComponent(context.auth.clientKey)}&conversionKey=${encodeURIComponent(conversionKey)}`,
                headers: {
                    'Authorization': `Bearer ${context.auth.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: rows
            });
        } catch (err) {
            lib.rethrowHubbiError(context, err);
        }

        return context.sendJson({ conversionKey, count: rows.length }, 'out');
    }
};

async function generateInspector(context) {

    const { conversionKey } = context.properties;

    const recordFields = {};
    const itemProperties = {};

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

        fields.forEach((field, index) => {
            if (!field.fieldId) return;
            const { inspectorType, inspectorConfig, schema: fieldSchema } = lib.mapFieldType(field.type);
            itemProperties[field.fieldId] = fieldSchema;
            const input = {
                type: inspectorType,
                label: field.name || field.fieldId,
                tooltip: `Source field: ${field.name || field.fieldId} (${field.type || 'string'})`,
                index: index + 1
            };
            if (inspectorConfig) input.config = inspectorConfig;
            recordFields[field.fieldId] = input;
        });
    }

    const schema = {
        type: 'object',
        properties: {
            conversionKey: { type: 'string' },
            records: {
                type: 'object',
                properties: {
                    ADD: {
                        type: 'array',
                        items: { type: 'object', properties: itemProperties },
                        minItems: 1
                    }
                }
            }
        },
        required: ['conversionKey']
    };

    const inputs = {
        conversionKey: {
            type: 'select',
            label: 'Conversion Key',
            tooltip: 'The conversion identifier (UUID) of the hub to start.',
            index: 0,
            source: {
                url: '/component/appmixer/hubbi/core/ListSourceHubsWithPostData?outPort=out',
                data: {
                    messages: {
                        'in/outputType': 'array'
                    },
                    transform: './ListSourceHubsWithPostData#toSelectArray'
                }
            }
        },
        records: {
            type: 'expression',
            label: 'Records',
            tooltip: 'Add one row per record. Each row uses the source field definitions of the selected hub. Within a row you can map single values from previous steps. All rows are sent to the hub in a single bulk request.',
            index: 1,
            levels: ['ADD'],
            minItems: 1,
            fields: recordFields
        }
    };

    return context.sendJson({ schema, inputs }, 'out');
}
