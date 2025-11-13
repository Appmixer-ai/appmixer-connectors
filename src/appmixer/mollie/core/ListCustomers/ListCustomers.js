'use strict';

const lib = require('../../lib');

const schema = {
    'resource': { 'type': 'string', 'title': 'Resource' },
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'email': { 'type': 'string', 'title': 'Email' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    '_links': {
        'type': 'object',
        'properties': {
            'self': {
                'type': 'object',
                'properties': {
                    'href': { 'type': 'string', 'title': 'Links.Self.Href' },
                    'type': { 'type': 'string', 'title': 'Links.Self.Type' }
                },
                'title': 'Links.Self'
            }
        },
        'title': 'Links'
    }
};

module.exports = {
    async receive(context) {

        const { profileId, testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Customers', value: 'customers' });
        }

        // https://docs.mollie.com/reference/v2/customers-api/list-customers
        const params = {};
        if (testmode !== undefined) {
            params.testmode = testmode;
        }
        if (profileId) {
            params.profileId = profileId;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            },
            params
        });

        const customers = data._embedded?.customers || [];

        return lib.sendArrayOutput({ context, records: customers, outputType });
    }
};
