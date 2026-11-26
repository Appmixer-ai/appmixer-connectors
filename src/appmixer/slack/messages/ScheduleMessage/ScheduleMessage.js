/* eslint-disable camelcase */
'use strict';

const { WebClient } = require('@slack/web-api');
const Entities = require('html-entities').AllHtmlEntities;
const lib = require('../../lib');

module.exports = {

    /**
     * @link https://docs.slack.dev/reference/methods/chat.scheduleMessage
     */
    async receive(context) {

        const { channel, text, postAt, blocks, threadTs, replyBroadcast } = context.messages.in.content;

        if (!channel) {
            throw new context.CancelError('Channel is required!');
        }
        if (!text) {
            throw new context.CancelError('Message is required!');
        }
        if (!postAt) {
            throw new context.CancelError('Post At is required!');
        }

        // chat.scheduleMessage takes whole seconds.
        const postAtSeconds = Math.floor(Number(lib.toSlackTimestamp(postAt, context, 'Post At')));
        const parsedBlocks = lib.parseBlocks(blocks, context);

        const web = new WebClient(context.auth.accessToken);
        const result = await web.chat.scheduleMessage({
            channel,
            post_at: postAtSeconds,
            text: new Entities().decode(text),
            ...(parsedBlocks ? { blocks: parsedBlocks } : {}),
            ...(threadTs ? { thread_ts: threadTs } : {}),
            ...(threadTs && typeof replyBroadcast === 'boolean' ? { reply_broadcast: replyBroadcast } : {})
        });

        return context.sendJson({
            channel: result.channel,
            scheduled_message_id: result.scheduled_message_id,
            post_at: result.post_at,
            message: result.message
        }, 'out');
    }
};
