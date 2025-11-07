'use strict';

const lib = require('../../lib');

const schema = {
    'resource': { 'type': 'string', 'title': 'Resource' },
    'id': { 'type': 'string', 'title': 'Id' },
    'status': { 'type': 'string', 'title': 'Status' },
    'method': { 'type': 'string', 'title': 'Method' }
};

module.exports = {
    async receive(context) {

        const { customerId, status, testmode, outputType } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer Id is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Mandates', value: 'mandates' });
        }

        // https://docs.mollie.com/reference/v2/mandates-api/list-mandates
        const params = {};

        if (status) {
            params.status = status;
        }

        if (testmode) {
            params.testmode = true;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/customers/${customerId}/mandates`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params
        });

        const mandates = data._embedded?.mandates || [];

        return lib.sendArrayOutput({ context, records: mandates, outputType });
    }
};
