'use strict';

const lib = require('../../lib');

const schema = {
    'resource': { 'type': 'string', 'title': 'Resource' },
    'id': { 'type': 'string', 'title': 'Id' },
    'amount': {
        'type': 'object',
        'properties': {
            'value': { 'type': 'string', 'title': 'Amount.Value' },
            'currency': { 'type': 'string', 'title': 'Amount.Currency' }
        },
        'title': 'Amount'
    },
    'status': { 'type': 'string', 'title': 'Status' }
};

module.exports = {
    async receive(context) {

        const { profileId, testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Refunds', value: 'refunds' });
        }

        // https://docs.mollie.com/reference/v2/refunds-api/list-refunds
        const params = {};

        if (profileId) {
            params.profileId = profileId;
        }

        if (testmode !== undefined && testmode !== null) {
            params.testmode = testmode;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/refunds',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params
        });

        const records = data._embedded?.refunds || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
