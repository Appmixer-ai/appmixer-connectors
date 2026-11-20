'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { channelId } = context.messages.in.content;

        if (!channelId) {
            throw new context.CancelError('Channel is required!');
        }

        const query = `query Channel($input: ChannelInput!) { channel(input: $input) { ${lib.CHANNEL_FIELDS} } }`;
        const data = await lib.graphql(context, query, { input: { id: channelId } });

        if (!data.channel) {
            throw new context.CancelError(`Channel ${channelId} was not found.`);
        }
        return context.sendJson(data.channel, 'out');
    }
};
