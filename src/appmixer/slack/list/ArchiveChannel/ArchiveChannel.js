'use strict';

const { WebClient } = require('@slack/web-api');

module.exports = {

    async receive(context) {

        const { channel } = context.messages.in.content;

        if (!channel) {
            throw new context.CancelError('Channel is required!');
        }

        const web = new WebClient(context.auth.accessToken);
        await web.conversations.archive({ channel });

        return context.sendJson({}, 'out');
    }
};
