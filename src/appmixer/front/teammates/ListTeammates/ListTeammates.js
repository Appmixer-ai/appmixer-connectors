'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;
        const { auth } = context;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Teammates' });
        }

        const cacheKey = 'front_teammates_' + auth.accessToken.slice(5, -5);
        let lock;
        try {
            lock = await context.lock(auth.accessToken.slice(5, -5));

            if (isSource) {
                const teammatesCached = await context.staticCache.get(cacheKey);
                if (teammatesCached) {
                    return context.sendJson({ result: teammatesCached }, 'out');
                }
            }

            // https://dev.frontapp.com/reference/list-teammates
            const { data } = await context.httpRequest({
                method: 'GET',
                url: 'https://api2.frontapp.com/teammates',
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`
                }
            });
            const records = data['_results'];

            if (isSource) {
                await context.staticCache.set(
                    cacheKey,
                    records.map(teammate => ({ id: teammate.id, email: teammate.email })),
                    context.config.listTeamsCacheTTL || (20 * 1000)
                );

                return context.sendJson({ result: records }, 'out');
            }

            await lib.sendArrayOutput({ context, records, outputType });
        } finally {
            lock?.unlock();
        }
    },

    toSelectArray({ result }) {

        return result.map(teammates => {
            return { label: teammates.email, value: teammates.id };
        });
    }
};

const schema = {
    '_links': {
        'type': 'object',
        'properties': {
            'self': { 'type': 'string', 'title': 'Links.Self' },
            'related': {
                'type': 'object',
                'properties': {
                    'inboxes': { 'type': 'string', 'title': 'Links.Related.Inboxes' },
                    'conversations': { 'type': 'string', 'title': 'Links.Related.Conversations' }
                },
                'title': 'Links.Related'
            }
        },
        'title': 'Links'
    },
    'id': { 'type': 'string', 'title': 'Teammate ID' },
    'email': { 'type': 'string', 'title': 'Email' },
    'username': { 'type': 'string', 'title': 'Username' },
    'first_name': { 'type': 'string', 'title': 'First Name' },
    'last_name': { 'type': 'string', 'title': 'Last Name' },
    'is_admin': { 'type': 'boolean', 'title': 'Is Admin' },
    'is_available': { 'type': 'boolean', 'title': 'Is Available' },
    'is_blocked': { 'type': 'boolean', 'title': 'Is Blocked' },
    'type': { 'type': 'string', 'title': 'Type' },
    'custom_fields': { 'type': 'object', 'title': 'Custom Fields' }
};
