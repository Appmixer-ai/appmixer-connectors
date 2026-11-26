'use strict';

const { WebClient } = require('@slack/web-api');
const Entities = require('html-entities').AllHtmlEntities;
const lib = require('../../lib');

// conversations.history maximum page size. Slack lowers it to 15 (and the rate limit to one request
// per minute) for commercially distributed apps that are not approved for the Slack Marketplace.
const PAGE_SIZE = 999;

const ITEM_SCHEMA = {
    type: 'object',
    required: ['type', 'ts'],
    properties: {
        type: { type: 'string', title: 'Type', example: 'message' },
        subtype: { type: 'string', title: 'Subtype', example: 'bot_message' },
        ts: { type: 'string', title: 'Message Timestamp', example: '1737024600.333444' },
        user: { type: 'string', title: 'User ID', example: 'U0ABC12345' },
        text: { type: 'string', title: 'Text', example: 'Deployment finished, 3 services updated.' },
        thread_ts: { type: 'string', title: 'Thread Timestamp', example: '1737024600.333444' },
        parent_user_id: { type: 'string', title: 'Parent User ID', example: 'U0ABC12345' },
        reply_count: { type: 'number', title: 'Reply Count', example: 2 },
        reply_users_count: { type: 'number', title: 'Reply Users Count', example: 1 },
        latest_reply: { type: 'string', title: 'Latest Reply Timestamp', example: '1737024700.111222' },
        bot_id: { type: 'string', title: 'Bot ID', example: 'B0ABC12345' },
        app_id: { type: 'string', title: 'App ID', example: 'A0ABC12345' },
        team: { type: 'string', title: 'Team ID', example: 'T0ABC12345' },
        blocks: {
            type: 'array',
            title: 'Blocks',
            example: [{ type: 'section', block_id: 'summary', text: { type: 'mrkdwn', text: 'Deployment finished, 3 services updated.' } }],
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', title: 'Blocks.Type', example: 'section' },
                    block_id: { type: 'string', title: 'Blocks.Block ID', example: 'summary' }
                }
            }
        },
        reactions: {
            type: 'array',
            title: 'Reactions',
            example: [{ name: 'thumbsup', count: 1, users: ['U0DEF67890'] }],
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string', title: 'Reactions.Name', example: 'thumbsup' },
                    count: { type: 'number', title: 'Reactions.Count', example: 1 },
                    users: { type: 'array', title: 'Reactions.Users', items: { type: 'string', example: 'U0DEF67890' } }
                }
            }
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    /**
     * @link https://docs.slack.dev/reference/methods/conversations.history
     */
    async receive(context) {

        const { channel, oldest, latest, inclusive, outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Messages' });
        }

        if (!channel) {
            throw new context.CancelError('Channel is required!');
        }

        const oldestTs = lib.toSlackTimestamp(oldest, context, 'Oldest');
        const latestTs = lib.toSlackTimestamp(latest, context, 'Latest');

        const web = new WebClient(context.auth.accessToken);
        const result = await web.conversations.history({
            channel,
            limit: PAGE_SIZE,
            ...(oldestTs ? { oldest: oldestTs } : {}),
            ...(latestTs ? { latest: latestTs } : {}),
            ...(inclusive === true ? { inclusive: true } : {})
        });

        const entities = new Entities();
        const records = (result.messages || []).map(message => ({
            ...message,
            ...(typeof message.text === 'string' ? { text: entities.decode(message.text) } : {})
        }));

        if (records.length === 0) {
            return context.sendJson({ channel, oldest, latest }, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
