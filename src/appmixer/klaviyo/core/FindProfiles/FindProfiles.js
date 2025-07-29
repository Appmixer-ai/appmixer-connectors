'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const {
            filter,
            sort,
            outputType
        } = context.messages.in;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Profiles' });
        }

        const queryParams = {
            'page[size]': 100,
            filter,
            sort,
            'additional-fields[profile]': 'subscriptions,predictive_analytics',
            'fields[profile]': 'email,phone_number,external_id,first_name,last_name,organization,title,image,created,updated,last_event_date,location,location.address1,location.address2,location.city,location.country,location.latitude,location.longitude,location.region,location.zip,location.timezone,location.ip,properties'
        };

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://a.klaviyo.com/api/profiles',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            params: queryParams
        });

        const profiles = data.data;

        if (!profiles || profiles.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({
            context,
            outputType,
            records: profiles
        });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'email': { 'type': 'string', 'title': 'Email' },
    'phone_number': { 'type': 'string', 'title': 'Phone Number' },
    'first_name': { 'type': 'string', 'title': 'First Name' },
    'last_name': { 'type': 'string', 'title': 'Last Name' },
    'properties': { 'type': 'object', 'title': 'Properties' }
};
