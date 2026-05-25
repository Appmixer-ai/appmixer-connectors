/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib');
const { WebClient } = require('@slack/web-api');

const outputPortName = 'out';

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

        return lib.sendArrayOutput({ context, outputPortName, outputType, records });
    },

    getOutputPortOptions(context, outputType) {

        if (outputType === 'object' || outputType === 'first') {
            return context.sendJson([
                { label: 'Channel ID', value: 'id' },
                { label: 'Channel Name', value: 'name' },
                { label: 'Is Private', value: 'is_private' },
                { label: 'Is Archived', value: 'is_archived' },
                { label: 'Is General', value: 'is_general' },
                { label: 'Is Member', value: 'is_member' },
                { label: 'Created (Unix timestamp)', value: 'created' },
                { label: 'Member Count', value: 'num_members' },
                { label: 'Creator User ID', value: 'creator' },
                { label: 'Topic', value: 'topic', schema: {
                    type: 'object',
                    properties: {
                        value: { type: 'string', title: 'Topic Value' },
                        creator: { type: 'string', title: 'Topic Creator' },
                        last_set: { type: 'number', title: 'Topic Last Set' }
                    }
                } },
                { label: 'Purpose', value: 'purpose', schema: {
                    type: 'object',
                    properties: {
                        value: { type: 'string', title: 'Purpose Value' },
                        creator: { type: 'string', title: 'Purpose Creator' },
                        last_set: { type: 'number', title: 'Purpose Last Set' }
                    }
                } }
            ], outputPortName);
        } else if (outputType === 'array') {
            return context.sendJson([
                {
                    label: 'Channels',
                    value: 'records',
                    schema: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { label: 'Channel ID', value: 'id' },
                                name: { label: 'Channel Name', value: 'name' },
                                is_private: { label: 'Is Private', value: 'is_private' },
                                is_archived: { label: 'Is Archived', value: 'is_archived' },
                                is_general: { label: 'Is General', value: 'is_general' },
                                is_member: { label: 'Is Member', value: 'is_member' },
                                created: { label: 'Created (Unix timestamp)', value: 'created' },
                                num_members: { label: 'Member Count', value: 'num_members' },
                                creator: { label: 'Creator User ID', value: 'creator' },
                                topic: { label: 'Topic', value: 'topic', schema: {
                                    type: 'object',
                                    properties: {
                                        value: { type: 'string', title: 'Topic Value' },
                                        creator: { type: 'string', title: 'Topic Creator' },
                                        last_set: { type: 'number', title: 'Topic Last Set' }
                                    }
                                } },
                                purpose: { label: 'Purpose', value: 'purpose', schema: {
                                    type: 'object',
                                    properties: {
                                        value: { type: 'string', title: 'Purpose Value' },
                                        creator: { type: 'string', title: 'Purpose Creator' },
                                        last_set: { type: 'number', title: 'Purpose Last Set' }
                                    }
                                } }
                            }
                        }
                    }
                }
            ], outputPortName);
        } else if (outputType === 'file') {
            return context.sendJson([
                { label: 'File ID', value: 'fileId', schema: { type: 'string', format: 'appmixer-file-id' } }
            ], outputPortName);
        } else {
            return context.sendJson([], outputPortName);
        }
    },

    channelsToSelectArray(channels) {

        let transformed = [];

        if (Array.isArray(channels)) {
            channels.forEach(channel => {
                if (channel['is_member']) {
                    transformed.push({
                        label: channel['name'],
                        value: channel['id']
                    });
                }
            });
        }

        return transformed;
    }
};
