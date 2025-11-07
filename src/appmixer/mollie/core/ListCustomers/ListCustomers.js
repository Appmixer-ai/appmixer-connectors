'use strict';

const lib = require('../../lib');

const schema = {
    'resource': { 'type': 'string', 'title': 'Resource' },
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'email': { 'type': 'string', 'title': 'Email' }
};

module.exports = {
    async receive(context) {

        const { profileId, testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Customers', value: 'customers' });
        }

        const params = {};

        if (profileId) {
            params.profileId = profileId;
        }

        if (testmode) {
            params.testmode = testmode;
        }

        // https://docs.mollie.com/reference/v2/customers-api/list-customers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params
        });

        const records = data._embedded?.customers || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
