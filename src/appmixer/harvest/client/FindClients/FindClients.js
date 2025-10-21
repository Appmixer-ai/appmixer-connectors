'use strict';

module.exports = {

    async receive(context) {

        const { isActive, updatedSince, page, perPage, outputType } = context.messages.in.content;

        // Generate output port schema dynamically based on the outputType
        if (context.properties.generateOutputPortOptions) {
            const schema = {
                'id': { 'type': 'integer', 'title': 'Client ID' },
                'name': { 'type': 'string', 'title': 'Client Name' },
                'isActive': { 'type': 'boolean', 'title': 'Is Active' },
                'address': { 'type': 'string', 'title': 'Address' },
                'currency': { 'type': 'string', 'title': 'Currency' },
                'createdAt': { 'type': 'string', 'title': 'Created At' },
                'updatedAt': { 'type': 'string', 'title': 'Updated At' }
            };

            return this.getOutputPortOptions(context, outputType, schema, { label: 'Clients', value: 'clients' });
        }

        let url = 'https://api.harvestapp.com/v2/clients';
        let query = {};

        if (isActive !== undefined) {
            query.is_active = isActive;
        }

        if (updatedSince) {
            query.updated_since = updatedSince;
        }

        if (page) {
            query.page = page;
        } else {
            query.page = 1;
        }

        if (perPage) {
            query.per_page = perPage;
        } else {
            query.per_page = 2000;
        }

        const options = {
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Harvest-Account-Id': context.auth.accountId,
                'User-Agent': 'Appmixer (support@appmixer.com)'
            },
            params: query
        };

        const response = await context.httpRequest(options);
        const clients = response.data.clients || [];

        if (clients.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return this.sendArrayOutput({ context, records: clients, outputType });
    },

    getOutputPortOptions(context, outputType, itemSchema, { label, value }) {
        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: label, ...schemaWithoutTitle } = schema;

                    res.push({
                        label, value: field, schema: schemaWithoutTitle
                    });
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
                label,
                value,
                schema: {
                    type: 'array',
                    items: { type: 'object', properties: itemSchema }
                }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    },

    async sendArrayOutput({ context, outputPortName = 'out', outputType = 'array', records = [] }) {
        if (outputType === 'first') {
            if (records.length === 0) {
                throw new context.CancelError('No records available for first output type');
            }
            // First item only.
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
            const csvString = this.toCsv(records);

            let buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `harvest-clients-export-${componentName}.csv`;
            const savedFile = await context.saveFileStream(fileName, buffer);

            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    toCsv(array) {
        if (array.length === 0) return '';

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
};
