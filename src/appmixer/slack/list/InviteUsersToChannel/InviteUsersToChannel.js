'use strict';

const { WebClient } = require('@slack/web-api');
const lib = require('../../lib');

// conversations.invite accepts up to 1000 user IDs.
const MAX_USERS = 1000;

module.exports = {

    /**
     * @link https://docs.slack.dev/reference/methods/conversations.invite
     */
    async receive(context) {

        const { channel, users, force } = context.messages.in.content;

        if (!channel) {
            throw new context.CancelError('Channel is required!');
        }
        if (!users || (Array.isArray(users) && users.length === 0)) {
            throw new context.CancelError('Users is required!');
        }

        const ids = lib.normalizeMultiselectInput(users, Infinity, context, 'Users')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);
        if (ids.length === 0) {
            throw new context.CancelError('Users is required!');
        }
        if (ids.length > MAX_USERS) {
            throw new context.CancelError(`You can invite at most ${MAX_USERS} users at once.`);
        }

        const web = new WebClient(context.auth.accessToken);
        const result = await web.conversations.invite({
            channel,
            users: ids.join(','),
            ...(force === true ? { force: true } : {})
        });

        return context.sendJson(result.channel, 'out');
    }
};
