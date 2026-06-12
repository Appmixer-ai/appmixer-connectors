'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (context.properties.generateInspector) {
            return generateInspector(context);
        }

        const { conversionKey, inputMode, records, recordsArray } = context.messages.in.content;

        if (!conversionKey) {
            throw new context.CancelError('Conversion Key is required!');
        }

        let rows;
        if (inputMode === 'array') {
            rows = toRecordsArray(recordsArray);
            if (rows === null) {
                throw new context.CancelError('Records array must be a JSON array of record objects.');
            }
        } else {
            rows = Array.isArray(records?.ADD) ? records.ADD : [];
        }

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

// Normalize the mapped "Records array" value into an array of record objects.
// Returns [] when empty, an array of objects when valid, or null when the value
// cannot be interpreted as records (so the caller can raise a clear error).
function toRecordsArray(value) {

    if (value == null || value === '') return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        let parsed;
        try {
            parsed = JSON.parse(value);
        } catch (err) {
            return null;
        }
        return toRecordsArray(parsed);
    }
    if (typeof value === 'object') {
        // Appmixer may serialize a mapped array into an object keyed by index
        // ("0", "1", "2", ...) when it flows through a non-array inspector field.
        // Detect that shape and restore the original array of records.
        const keys = Object.keys(value);
        const isIndexed = keys.length > 0 && keys.every((key, index) => key === String(index));
        if (isIndexed) return keys.map(key => value[key]);
        return [value];
    }
    return null;
}

async function generateInspector(context) {

    const { conversionKey } = context.properties;

    const recordFields = {};
    const itemProperties = {};
    let keysHint = '';

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
        const keys = [];

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
            keys.push(field.name && field.name !== field.fieldId ? `${field.fieldId} (${field.name})` : field.fieldId);
        });

        if (keys.length) {
            keysHint = ` Each object's keys must match the hub source fields: ${keys.join(', ')}.`;
        }
    }

    const schema = {
        type: 'object',
        properties: {
            conversionKey: { type: 'string' },
            inputMode: { type: 'string', enum: ['manual', 'array'] },
            records: {
                type: 'object',
                properties: {
                    ADD: {
                        type: 'array',
                        items: { type: 'object', properties: itemProperties },
                        minItems: 1
                    }
                }
            },
            recordsArray: {
                type: 'array',
                items: { type: 'object' }
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
        inputMode: {
            type: 'select',
            label: 'Records source',
            tooltip: 'Choose how to provide records: build them row by row using the hub field definitions, or map a whole array of records coming from a previous step.',
            index: 1,
            variables: false,
            defaultValue: 'manual',
            options: [
                { content: 'Build manually', value: 'manual' },
                { content: 'Map array from previous step', value: 'array' }
            ]
        },
        records: {
            type: 'expression',
            label: 'Records',
            tooltip: 'Add one row per record. Each row uses the source field definitions of the selected hub. Within a row you can map single values from previous steps. All rows are sent to the hub in a single bulk request.',
            index: 2,
            levels: ['ADD'],
            minItems: 1,
            when: { eq: { './inputMode': 'manual' } },
            fields: recordFields
        },
        recordsArray: {
            type: 'text',
            label: 'Records array',
            tooltip: `Map an array of record objects from a previous step (e.g. the output of a list/find/CSV step). The whole array is sent to the hub in a single bulk request.${keysHint}`,
            index: 3,
            when: { eq: { './inputMode': 'array' } }
        }
    };

    return context.sendJson({ schema, inputs }, 'out');
}
