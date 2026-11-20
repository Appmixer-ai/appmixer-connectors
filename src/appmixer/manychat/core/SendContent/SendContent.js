'use strict';

const lib = require('../../lib');

const MEDIA_TYPES = ['image', 'video', 'audio', 'file'];

/**
 * Build the Dynamic Block (v2) payload for one message.
 * https://manychat.github.io/dynamic_block_docs/ and /channels/ (content.type for
 * Instagram, WhatsApp and Telegram; Messenger has no type).
 * @param {object} context
 * @param {object} input
 * @returns {object}
 */
const buildData = function(context, { channel, contentType, text, mediaUrl }) {

    let message;
    if (contentType === 'text') {
        if (!text) {
            throw new context.CancelError('Text is required when Content Type is Text!');
        }
        message = { type: 'text', text };
    } else if (MEDIA_TYPES.includes(contentType)) {
        if (!mediaUrl) {
            throw new context.CancelError('Media URL is required for this Content Type!');
        }
        message = { type: contentType, url: mediaUrl };
    } else {
        throw new context.CancelError(`Unsupported Content Type: ${contentType}`);
    }

    const content = { messages: [message], actions: [], quick_replies: [] };
    if (channel && channel !== 'facebook') {
        content.type = channel;
    }
    return { version: 'v2', content };
};

module.exports = {

    buildData,

    async receive(context) {

        const { subscriberId, channel, contentType, text, mediaUrl, messageTag } = context.messages.in.content;

        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }
        if (!contentType) {
            throw new context.CancelError('Content Type is required!');
        }

        const body = {
            subscriber_id: lib.toApiId(context, subscriberId, 'Subscriber ID'),
            data: buildData(context, { channel, contentType, text, mediaUrl })
        };
        if (messageTag) {
            body.message_tag = messageTag;
        }

        await lib.request(context, { method: 'POST', path: '/fb/sending/sendContent', data: body });

        return context.sendJson({ subscriberId: String(subscriberId), status: 'success' }, 'out');
    }
};
