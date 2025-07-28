'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'email': { 'type': 'string', 'title': 'Email' },
    'phone_number': { 'type': 'string', 'title': 'Phone Number' },
    'first_name': { 'type': 'string', 'title': 'First Name' },
    'last_name': { 'type': 'string', 'title': 'Last Name' },
    'properties': { 'type': 'object', 'title': 'Properties' }
};

module.exports = {

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Profiles' });
        }

        let url = 'https://a.klaviyo.com/api/profiles/';
        const params = new URLSearchParams();

        if (query) {
            // Search by email or phone number using filter
            params.append('filter', `equals(email,"${query}"),equals(phone_number,"${query}")`);
        }

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            }
        });

        const profiles = response.data.data.map(profile => ({
            id: profile.id,
            email: profile.attributes.email,
            phone_number: profile.attributes.phone_number,
            first_name: profile.attributes.first_name,
            last_name: profile.attributes.last_name,
            properties: profile.attributes.properties || {}
        }));

        if (profiles.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: profiles, outputType });
    }
};
