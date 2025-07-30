
'use strict';

const lib = require('../../lib.generated');

// Schema of the single user item
const schema = {
    'id': { 'type': 'string', 'title': 'User ID' },
    'email': { 'type': 'string', 'title': 'Email' },
    'role': { 'type': 'string', 'title': 'Role' },
    'firstName': { 'type': 'string', 'title': 'First Name' },
    'lastName': { 'type': 'string', 'title': 'Last Name' },
    'isActive': { 'type': 'boolean', 'title': 'Is Active' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'lastLoginAt': { 'type': 'string', 'title': 'Last Login At' }
};

module.exports = {
    async receive(context) {

        const { search, outputType = 'array' } = context.messages.in.content;
        const { baseUrl, apiToken } = context.auth;

        // Generate output port schema dynamically based on the outputType
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Users', value: 'result' });
        }

        const cleanBaseUrl = baseUrl.replace(/\/$/, '');

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${cleanBaseUrl}/api/v1/users`,
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        let users = data.data || data || [];

        // Apply search filter if provided
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(user => 
                (user.email && user.email.toLowerCase().includes(searchLower)) ||
                (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
                (user.lastName && user.lastName.toLowerCase().includes(searchLower))
            );
        }

        if (users.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        // Modify the output based on the outputType
        return lib.sendArrayOutput({ context, records: users, outputType });
    }
};
