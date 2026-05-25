/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib');
const { WebClient } = require('@slack/web-api');

const outputPortName = 'channels';

const schema = {
    id:          { type: 'string',  title: 'Channel ID',              example: 'C01234567' },
    name:        { type: 'string',  title: 'Channel Name',            example: 'general' },
    is_private:  { type: 'boolean', title: 'Is Private',              example: false },
    is_archived: { type: 'boolean', title: 'Is Archived',             example: false },
    is_general:  { type: 'boolean', title: 'Is General',              example: true },
    is_member:   { type: 'boolean', title: 'Is Member',               example: true },
    created:     { type: 'number',  title: 'Created (Unix timestamp)', example: 1609459200 },
    num_members: { type: 'number',  title: 'Member Count',            example: 42 },
    creator:     { type: 'string',  title: 'Creator User ID',         example: 'U01234567' },
    topic: {
        type: 'object', title: 'Topic',
        properties: {
            value:    { type: 'string', title: 'Topic Value',    example: 'Company announcements' },
            creator:  { type: 'string', title: 'Topic Creator',  example: 'U01234567' },
            last_set: { type: 'number', title: 'Topic Last Set', example: 1609459200 }
        }
    },
    purpose: {
        type: 'object', title: 'Purpose',
        properties: {
            value:    { type: 'string', title: 'Purpose Value',    example: 'This channel is for team-wide communication' },
            creator:  { type: 'string', title: 'Purpose Creator',  example: 'U01234567' },
            last_set: { type: 'number', title: 'Purpose Last Set', example: 1609459200 }
        }
    }
};

module.exports = {

    /**
     * @link https://api.slack.com/methods/conversations.list
     */
    async receive(context) {

        const generateOutputPortOptions = context.properties.generateOutputPortOptions;
        const { outputType, limit, types = 'public_channel,private_channel' } = context.messages.in.content;

        if (generateOutputPortOptions) {
            return this.getOutputPortOptions(context, outputType);
        }

        const web = new WebClient(context.auth.accessToken);
        const channels = [];
        let cursor;

        do {
            const response = await web.conversations.list({
                limit: Math.min(limit || 999, 999),
                types,
                exclude_archived: true,
                ...(cursor ? { cursor } : {})
            });
            channels.push(...response.channels);
            cursor = response.response_metadata?.next_cursor;
        } while (cursor && (!limit || channels.length < limit));

        const records = limit ? channels.slice(0, limit) : channels;

        // When called as a dropdown source (no outputType), preserve original behaviour
        // so consuming components' channelsToSelectArray transform still works.
        if (!outputType) {
            return context.sendJson(records, outputPortName);
        }

        return lib.sendArrayOutput({ context, outputPortName, outputType, records });
    },

    getOutputPortOptions(context, outputType) {

        if (outputType === 'object' || outputType === 'first') {
            const options = Object.entries(schema).map(([field, def]) => {
                const { title: label, ...rest } = def;
                return { label, value: field, schema: rest };
            });
            return context.sendJson(options, outputPortName);
        }

        if (outputType === 'array') {
            return context.sendJson([{
                label: 'Channels',
                value: 'records',
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: Object.fromEntries(
                            Object.entries(schema).map(([field, def]) => {
                                const { title: label, ...rest } = def;
                                return [field, { label, value: field, schema: rest }];
                            })
                        )
                    }
                }
            }], outputPortName);
        }

        if (outputType === 'file') {
            return context.sendJson([
                { label: 'File ID', value: 'fileId', schema: { type: 'string', format: 'appmixer-file-id' } }
            ], outputPortName);
        }

        return context.sendJson([], outputPortName);
    },

    channelsToSelectArray(channels) {

        if (!Array.isArray(channels)) return [];

        return channels
            .filter(channel => channel['is_member'])
            .map(channel => ({
                label: channel['name'],
                value: channel['id']
            }));
    }
};
