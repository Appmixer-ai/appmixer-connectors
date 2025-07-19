'use strict';

const lib = require('../../lib.generated');

module.exports = {
    async receive(context) {

        const { status, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Users', value: 'result' });
        }

        // Build query parameters
        const queryParams = {
            status,
            page_size: 2000
        };

        // https://developers.zoom.us/docs/api/users/#tag/users/get/users
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.zoom.us/v2/users',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: queryParams
        });

        const records = data.users || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'User ID' },
    'first_name': { 'type': 'string', 'title': 'First Name' },
    'last_name': { 'type': 'string', 'title': 'Last Name' },
    'email': { 'type': 'string', 'title': 'Email' },
    'type': { 'type': 'integer', 'title': 'User Type' },
    'status': { 'type': 'string', 'title': 'Status' },
    'pmi': { 'type': 'string', 'title': 'Personal Meeting ID' },
    'timezone': { 'type': 'string', 'title': 'Timezone' },
    'verified': { 'type': 'integer', 'title': 'Verified' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'last_login_time': { 'type': 'string', 'title': 'Last Login Time' },
    'language': { 'type': 'string', 'title': 'Language' },
    'phone_number': { 'type': 'string', 'title': 'Phone Number' },
    'role_name': { 'type': 'string', 'title': 'Role Name' }
};
