'use strict';

const schema = {
    id: { type: 'string', title: 'ID' },
    name: { type: 'string', title: 'Name' },
    created_at: { type: 'string', title: 'Created At' }
};

function toCsv(array) {
    if (!array.length) return '';
    const headers = Object.keys(array[0]);
    return [
        headers.join(','),
        ...array.map(item => headers.map(h => JSON.stringify(item[h] ?? '')).join(','))
    ].join('\n');
}

module.exports = {
    async receive(context) {
        // Dynamic output port options
        if (context.properties.generateOutputPortOptions) {
            const outputType = context.messages.in?.content?.outputType || 'array';
            if (outputType === 'object' || outputType === 'first') {
                const options = Object.keys(schema).map(field => ({
                    label: schema[field].title,
                    value: field,
                    schema: { ...schema[field] }
                }));
                options.push({ label: 'Current Item Index', value: 'index', schema: { type: 'integer' } });
                options.push({ label: 'Items Count', value: 'count', schema: { type: 'integer' } });
                return context.sendJson(options, 'out');
            }
            if (outputType === 'array') {
                return context.sendJson([
                    {
                        label: 'API Keys',
                        value: 'data',
                        schema: { type: 'array', items: { type: 'object', properties: schema } }
                    }
                ], 'out');
            }
            if (outputType === 'file') {
                return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
            }
        }

        // https://resend.com/docs/api-reference/api-keys#list-api-keys
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.resend.com/api-keys',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const outputType = context.messages.in?.content?.outputType || 'array';
        const records = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);

        if (!records.length) {
            return context.sendJson({}, 'out');
        }

        if (outputType === 'first') {
            await context.sendJson({ ...records[0], index: 0, count: records.length }, 'out');
            return;
        }
        if (outputType === 'object') {
            for (let i = 0; i < records.length; i++) {
                await context.sendJson({ ...records[i], index: i, count: records.length }, 'out');
            }
            return;
        }
        if (outputType === 'array') {
            await context.sendJson({ data: records, count: records.length }, 'out');
            return;
        }
        if (outputType === 'file') {
            const csv = toCsv(records);
            const buffer = Buffer.from(csv, 'utf8');
            const fileName = 'api-keys-export.csv';
            const savedFile = await context.saveFileStream(fileName, buffer);
            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, 'out');
            return;
        }
        throw new context.CancelError('Unsupported outputType ' + outputType);
    }
};
