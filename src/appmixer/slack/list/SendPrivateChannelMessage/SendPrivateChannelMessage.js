/* eslint-disable camelcase */
'use strict';
const lib = require('../../lib');

/**
 * Component which sends new message to private channel.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const {
            channelId,
            text,
            asBot,
            thread_ts,
            reply_broadcast,
            username,
            iconUrl
        } = context.messages.message.content;

        const options = {};
        if (username) options.username = username;
        if (iconUrl) options.iconUrl = iconUrl;

        const message = await lib.sendMessage(
            context,
            channelId,
            text,
            asBot,
            thread_ts,
            reply_broadcast,
            options
        );
        return context.sendJson(message, 'newMessage');
    }
};
