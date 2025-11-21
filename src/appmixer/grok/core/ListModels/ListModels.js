'use strict';

const lib = require('../../lib');

const schema = {
    'id': {
        'type': 'string',
        'title': 'Id'
    },
    'object': {
        'type': 'string',
        'title': 'Object'
    },
    'created': {
        'type': 'number',
        'title': 'Created'
    },
    'owned_by': {
        'type': 'string',
        'title': 'Owned By'
    },
    'permissions': {
        'type': 'array',
        'items': {},
        'title': 'Permissions'
    }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.properties;

        if (!outputType) {
            throw new context.CancelError('Output Type is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // https://docs.x.ai/docs/models
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.x.ai/v1/models',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const records = response.data.data;

        if (outputType === 'first') {
            if (records.length === 0) {
                throw new context.CancelError('No records available for first output type');
            }
            return context.sendJson({ ...records[0], index: 0, count: records.length }, 'out');
        } else if (outputType === 'object') {
            for (let index = 0; index < records.length; index++) {
                await context.sendJson({ ...records[index], index, count: records.length }, 'out');
            }
        } else if (outputType === 'array') {
            return context.sendJson({ result: records, count: records.length }, 'out');
        } else if (outputType === 'file') {
            const pathModule = require('path');
            const DEFAULT_PREFIX = '<SERVICE>-objects-export';
            const csvString = toCsv(records);
            let buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || DEFAULT_PREFIX}-${componentName}.csv`;
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            return context.sendJson({ fileId: savedFile.fileId }, 'out');
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    }
};

const toCsv = (array) => {
    if (!array || array.length === 0) {
        return '';
    }
    const headers = Object.keys(array[0]);
    return [
        headers.join(','),
        ...array.map(items => {
            return Object.values(items).map(property => {
                if (typeof property === 'object') {
                    return JSON.stringify(property);
                }
                return property;
            }).join(',');
        })
    ].join('\n');
};
