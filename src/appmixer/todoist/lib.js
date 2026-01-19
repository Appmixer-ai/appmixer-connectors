'use strict';

const pathModule = require('path');

const TODOIST_COLORS = [
    { label: 'Berry Red', value: 'berry_red' },
    { label: 'Red', value: 'red' },
    { label: 'Orange', value: 'orange' },
    { label: 'Yellow', value: 'yellow' },
    { label: 'Olive Green', value: 'olive_green' },
    { label: 'Lime Green', value: 'lime_green' },
    { label: 'Green', value: 'green' },
    { label: 'Mint Green', value: 'mint_green' },
    { label: 'Teal', value: 'teal' },
    { label: 'Sky Blue', value: 'sky_blue' },
    { label: 'Light Blue', value: 'light_blue' },
    { label: 'Blue', value: 'blue' },
    { label: 'Grape', value: 'grape' },
    { label: 'Violet', value: 'violet' },
    { label: 'Lavender', value: 'lavender' },
    { label: 'Magenta', value: 'magenta' },
    { label: 'Salmon', value: 'salmon' },
    { label: 'Charcoal', value: 'charcoal' },
    { label: 'Grey', value: 'grey' },
    { label: 'Taupe', value: 'taupe' }
];

const PRIORITY_OPTIONS = [
    { label: 'Priority 1 (Highest)', value: 4 },
    { label: 'Priority 2', value: 3 },
    { label: 'Priority 3', value: 2 },
    { label: 'Priority 4 (Lowest)', value: 1 }
];

const DEFAULT_PREFIX = 'todoist';

const toCsv = (array) => {
    if (!array || array.length === 0) {
        return '';
    }
    const headers = Object.keys(array[0]);

    return [
        headers.join(','),
        ...array.map(item => {
            return Object.values(item).map(property => {
                if (typeof property === 'object') {
                    return JSON.stringify(property);
                }
                return property;
            }).join(',');
        })
    ].join('\n');
};

module.exports = {

    TODOIST_COLORS,

    PRIORITY_OPTIONS,

    async apiRequest(context, endpoint, options = {}) {

        const { method = 'GET', data, params } = options;

        const requestOptions = {
            method,
            url: `https://api.todoist.com/rest/v2${endpoint}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            requestOptions.data = data;
        }

        if (params) {
            requestOptions.params = params;
        }

        const response = await context.httpRequest(requestOptions);
        return response.data;
    },

    async syncApiRequest(context, commands) {

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.todoist.com/sync/v9/sync',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                commands
            }
        });
        return response.data;
    },

    async sendArrayOutput({
        context,
        outputPortName = 'out',
        outputType = 'array',
        records = []
    }) {

        if (outputType === 'first') {
            if (records.length === 0) {
                throw new context.CancelError('No records available for first output type');
            }
            // One by one.
            await context.sendJson(
                { ...records[0], index: 0, count: records.length },
                outputPortName
            );
        } else if (outputType === 'object') {
            // One by one.
            for (let index = 0; index < records.length; index++) {
                await context.sendJson(
                    { ...records[index], index, count: records.length },
                    outputPortName
                );
            }
        } else if (outputType === 'array') {
            // All at once.
            await context.sendJson({ result: records, count: records.length }, outputPortName);
        } else if (outputType === 'file') {

            // Into CSV file.
            const csvString = toCsv(records);

            let buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || DEFAULT_PREFIX}-${componentName}.csv`;
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);

            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    getOutputPortSchema(schema, outputType, label) {

        if (outputType === 'first' || outputType === 'object') {
            return Object.keys(schema)
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
        }

        if (outputType === 'array') {
            return [{
                label: label || 'Records',
                value: 'result',
                schema: {
                    type: 'array',
                    items: { type: 'object', properties: schema }
                }
            }];
        }

        if (outputType === 'file') {
            return [{ label: 'File ID', value: 'fileId' }];
        }
    }
};
