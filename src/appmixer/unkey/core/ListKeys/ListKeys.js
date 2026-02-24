'use strict';

const schema = {
    'keyId': { 'type': 'string', 'title': 'Key ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'ownerId': { 'type': 'string', 'title': 'Owner ID' },
    'enabled': { 'type': 'boolean', 'title': 'Enabled' },
    'expires': { 'type': 'integer', 'title': 'Expires' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'meta': { 'type': 'object', 'title': 'Metadata' },
    'remaining': { 'type': 'integer', 'title': 'Remaining' }
};

module.exports = {
    async receive(context) {
        const { apiId, ownerId, outputType } = context.messages.in.content;

        // When the UI requests output port options, respond without requiring inputs
        if (context.properties.generateOutputPortOptions) {
            return getOutputPortOptions(context, outputType);
        }

        if (!apiId) {
            throw new context.CancelError('API ID is required!');
        }

        const allKeys = [];
        let cursor = null;
        const maxRecords = 1000;

        // Fetch all records with pagination
        while (allKeys.length < maxRecords) {
            const params = {
                apiId,
                limit: 100
            };

            if (ownerId) {
                params.ownerId = ownerId;
            }

            if (cursor) {
                params.cursor = cursor;
            }

            const { data } = await context.httpRequest({
                method: 'POST',
                url: 'https://api.unkey.com/v2/apis.listKeys',
                headers: {
                    'Authorization': `Bearer ${context.auth.apiKey}`,
                    'Content-Type': 'application/json'
                },
                data: params
            });

            const keys = data.data || [];
            allKeys.push(...keys);

            // Stop if no more pages or we've reached max records
            if (!data.hasMore || allKeys.length >= maxRecords) {
                break;
            }

            cursor = data.cursor;
        }

        // Trim to max records if needed
        const keys = allKeys.slice(0, maxRecords);

        if (keys.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        if (outputType === 'first') {
            await context.sendJson(
                { ...keys[0], index: 0, count: keys.length },
                'out'
            );
        } else if (outputType === 'object') {
            for (let index = 0; index < keys.length; index++) {
                await context.sendJson(
                    { ...keys[index], index, count: keys.length },
                    'out'
                );
            }
        } else {
            // array is default
            await context.sendJson({ keys, count: keys.length }, 'out');
        }
    }
};

function getOutputPortOptions(context, outputType) {
    if (outputType === 'object' || outputType === 'first') {
        const options = Object.keys(schema)
            .reduce((res, field) => {
                const fieldSchema = schema[field];
                const { title: label, ...schemaWithoutTitle } = fieldSchema;
                res.push({ label, value: field, schema: schemaWithoutTitle });
                return res;
            }, [{
                label: 'Current Item Index',
                value: 'index',
                schema: { type: 'integer' }
            }, {
                label: 'Items Count',
                value: 'count',
                schema: { type: 'integer' }
            }]);
        return context.sendJson(options, 'out');
    }

    if (outputType === 'array') {
        return context.sendJson([{
            label: 'Keys',
            value: 'keys',
            schema: {
                type: 'array',
                items: { type: 'object', properties: schema }
            }
        }, {
            label: 'Count',
            value: 'count',
            schema: { type: 'integer' }
        }], 'out');
    }
}
