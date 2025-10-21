'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;
        const { auth } = context;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Teams' });
        }

        const cacheKey = 'front_teams_' + auth.accessToken.slice(5, -5);
        let lock;
        try {
            lock = await context.lock(auth.accessToken.slice(5, -5));

            if (isSource) {
                const teamsCached = await context.staticCache.get(cacheKey);
                if (teamsCached) {
                    return context.sendJson({ result: teamsCached }, 'out');
                }
            }

            // https://dev.frontapp.com/reference/list-teams
            const { data } = await context.httpRequest({
                method: 'GET',
                url: 'https://api2.frontapp.com/teams',
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`
                }
            });

            const records = data['_results'];

            if (isSource) {
                await context.staticCache.set(
                    cacheKey,
                    records.map(team => ({ id: team.id, name: team.name })),
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

        return result.map(team => {
            return { label: team.name, value: team.id };
        });
    }
};


const schema = {
    'id': { 'type': 'string', 'title': 'Team ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'is_private': { 'type': 'boolean', 'title': 'Is Private' },
    'is_public': { 'type': 'boolean', 'title': 'Is Public' },
    'custom_fields': { 'type': 'object', 'title': 'Custom Fields' },
    '_links': {
        'type': 'object',
        'title': 'Links',
        'properties': {
            'self': { 'type': 'string', 'title': 'Self Link' },
            'related': {
                'type': 'object',
                'title': 'Related Links',
                'properties': {
                    'channels': { 'type': 'string', 'title': 'Channels Link' },
                    'conversations': { 'type': 'string', 'title': 'Conversations Link' },
                    'teammates': { 'type': 'string', 'title': 'Teammates Link' },
                    'owner': { 'type': 'string', 'title': 'Owner Link' }
                }
            }
        }
    }
};
