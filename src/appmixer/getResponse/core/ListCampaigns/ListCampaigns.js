'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Campaign ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'status': { 'type': 'string', 'title': 'Status' },
    'createdOn': { 'type': 'string', 'format': 'date-time', 'title': 'Created On' },
    'updatedOn': { 'type': 'string', 'format': 'date-time', 'title': 'Updated On' },
    'description': { 'type': 'string', 'title': 'Description' },
    'defaultFrom': {
        'type': 'object',
        'properties': {
            'fromFieldId': { 'type': 'string', 'title': 'Default From.From Field Id' },
            'email': { 'type': 'string', 'title': 'Default From.Email' },
            'name': { 'type': 'string', 'title': 'Default From.Name' }
        },
        'title': 'Default From'
    },
    'defaultReplyTo': {
        'type': 'object',
        'properties': {
            'fromFieldId': { 'type': 'string', 'title': 'Default Reply To.From Field Id' },
            'email': { 'type': 'string', 'title': 'Default Reply To.Email' },
            'name': { 'type': 'string', 'title': 'Default Reply To.Name' }
        },
        'title': 'Default Reply To'
    },
    'languageCode': { 'type': 'string', 'title': 'Language Code' },
    'timezone': { 'type': 'string', 'title': 'Timezone' },
    'href': { 'type': 'string', 'title': 'Href' }
};

module.exports = {
    async receive(context) {

        const { status, sort, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Campaigns' });
        }

        const params = {};

        if (status) {
            params.status = status;
        }

        if (sort) {
            params.sort = sort;
        }

        // https://apidocs.getresponse.com/#operation/getCampaigns
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.getresponse.com/v3/campaigns',
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params
        });

        const campaigns = data.campaigns || [];

        return lib.sendArrayOutput({ context, records: campaigns, outputType });
    }
};
