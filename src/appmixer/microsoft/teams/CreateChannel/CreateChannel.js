'use strict';

const lib = require('../lib');
const { makeRequest } = require('../commons');
const { ITEM_SCHEMA } = require('../ListChannels/ListChannels');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { teamId, displayName, description, membershipType = 'standard' } = context.messages.in.content;

        if (!teamId) {
            throw new context.CancelError('Team is required!');
        }
        if (!displayName) {
            throw new context.CancelError('Name is required!');
        }

        const data = { displayName, membershipType };
        if (description) {
            data.description = description;
        }
        if (membershipType === 'private') {
            // A private channel needs an owner, and with a delegated token that is the caller.
            const me = await lib.getMe(context);
            data.members = [{
                '@odata.type': '#microsoft.graph.aadUserConversationMember',
                'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${me.id}')`,
                roles: ['owner']
            }];
        }

        const { data: channel } = await makeRequest(context, {
            method: 'POST',
            path: `/teams/${encodeURIComponent(teamId)}/channels`,
            data
        });

        return context.sendJson(channel, 'out');
    }
};
