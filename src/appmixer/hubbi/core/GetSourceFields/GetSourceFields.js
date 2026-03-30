'use strict';

const lib = require('../../lib');

const SCHEMA = {
    fieldId: { type: 'string', title: 'Field ID' },
    name: { type: 'string', title: 'Name' },
    type: { type: 'string', title: 'Type' }
};

module.exports = {

    async receive(context) {

        const { conversionKey, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Source Fields', value: 'result' });
        }

        if (!conversionKey) {
            throw new context.CancelError('Conversion Key is required!');
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
