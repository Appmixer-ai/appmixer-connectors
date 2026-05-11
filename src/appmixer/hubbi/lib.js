'use strict';

const pathModule = require('path');

const DEFAULT_PREFIX = 'hubbi-objects-export';

module.exports = {

    mapFieldType(netType) {

        const t = String(netType || '').trim().toLowerCase();
        switch (t) {
            case 'int16':
            case 'int32':
            case 'int64':
            case 'long':
            case 'short':
            case 'byte':
            case 'sbyte':
            case 'uint16':
            case 'uint32':
            case 'uint64':
            case 'integer':
                return { inspectorType: 'number', schema: { type: 'integer' } };
            case 'double':
            case 'decimal':
            case 'single':
            case 'float':
                return { inspectorType: 'number', schema: { type: 'number' } };
            case 'boolean':
            case 'bool':
                return { inspectorType: 'toggle', schema: { type: 'boolean' } };
            case 'datetime':
            case 'datetimeoffset':
                return {
                    inspectorType: 'date-time',
                    inspectorConfig: { enableTime: true },
                    schema: { type: 'string', format: 'date-time' }
                };
            case 'date':
            case 'dateonly':
                return {
                    inspectorType: 'date-time',
                    schema: { type: 'string', format: 'date' }
                };
            case 'guid':
            case 'uuid':
                return { inspectorType: 'text', schema: { type: 'string', format: 'uuid' } };
            case 'string':
            case 'char':
            case '':
                return { inspectorType: 'text', schema: { type: 'string' } };
            default:
                return { inspectorType: 'text', schema: { type: 'string' } };
        }
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
            await context.sendJson(
                { ...records[0], index: 0, count: records.length },
                outputPortName
            );
        } else if (outputType === 'object') {
            for (let index = 0; index < records.length; index++) {
                await context.sendJson(
                    { ...records[index], index, count: records.length },
                    outputPortName
                );
            }
        } else if (outputType === 'array') {
            await context.sendJson({ result: records, count: records.length }, outputPortName);
        } else if (outputType === 'file') {
            const csvString = toCsv(records);
            const buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || DEFAULT_PREFIX}-${componentName}.csv`;
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    getOutputPortOptions(context, outputType, itemSchema, { label, value }) {

        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema).reduce((res, field) => {
                const schema = itemSchema[field];
                const { title: fieldLabel, ...schemaWithoutTitle } = schema;
                res.push({ label: fieldLabel, value: field, schema: schemaWithoutTitle });
                return res;
            }, [
                { label: 'Current Item Index', value: 'index', schema: { type: 'integer' } },
                { label: 'Items Count', value: 'count', schema: { type: 'integer' } }
            ]);
            return context.sendJson(options, 'out');
        }

        if (outputType === 'array') {
            return context.sendJson([{
                label,
                value,
                schema: {
                    type: 'array',
                    items: { type: 'object', properties: itemSchema }
                }
            }, {
                label: 'Items Count',
                value: 'count',
                schema: { type: 'integer' }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};

function toCsv(array) {

    if (!array || array.length === 0) return '';
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
}
