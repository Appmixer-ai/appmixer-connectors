'use strict';

const lib = require('../../lib');

const schema = {
    'did': { 'type': 'string', 'title': 'DID' },
    'handle': { 'type': 'string', 'title': 'Handle' },
    'displayName': { 'type': 'string', 'title': 'Display Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'avatar': { 'type': 'string', 'title': 'Avatar URL' },
    'followersCount': { 'type': 'integer', 'title': 'Followers Count' },
    'followsCount': { 'type': 'integer', 'title': 'Follows Count' },
    'postsCount': { 'type': 'integer', 'title': 'Posts Count' },
    'indexedAt': { 'type': 'string', 'title': 'Indexed At' }
};

module.exports = {

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Users', value: 'users' });
        }

        if (!query) {
            throw new context.CancelError('Search Query is required!');
        }

        const response = await lib.xrpc(context, {
            method: 'GET',
            nsid: 'app.bsky.actor.searchActors',
            params: { q: query, limit: 25 }
        });

        const actors = response.actors || [];

        if (actors.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: actors });
    }
};
