'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { isActive, updatedSince, outputType } = context.messages.in.content;

        // Generate output port schema dynamically based on the outputType
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Clients' });
        }

        let url = 'https://api.harvestapp.com/v2/clients';
        let query = {
            per_page: 2000
        };

        if (isActive !== undefined) {
            query.is_active = isActive;
        }

        if (updatedSince) {
            query.updated_since = updatedSince;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Harvest-Account-Id': context.auth.profileInfo.accountId,
                'User-Agent': 'Appmixer (info@appmixer.ai)'
            },
            params: query
        });
        const clients = data.clients || [];

        if (clients.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: clients, outputType });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Client ID' },
    'name': { 'type': 'string', 'title': 'Client Name' },
    'isActive': { 'type': 'boolean', 'title': 'Is Active' },
    'address': { 'type': 'string', 'title': 'Address' },
    'currency': { 'type': 'string', 'title': 'Currency' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' }
};
