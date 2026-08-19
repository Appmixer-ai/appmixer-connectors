'use strict';

const lib = require('../../lib');

const SCHEMA = {
    fieldId: { type: 'string', title: 'Field ID', example: 'orderNumber' },
    name: { type: 'string', title: 'Name', example: 'Order Number' },
    type: { type: 'string', title: 'Type', example: 'String' }
};

module.exports = {

    async receive(context) {

        const { conversionKey, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Source Fields', value: 'result' });
        }

        if (!conversionKey) {
            throw new context.CancelError('Hub is required!');
        }

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

        return lib.sendArrayOutput({ context, outputType, records: fields });
    }
};
