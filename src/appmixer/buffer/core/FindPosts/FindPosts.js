'use strict';

const lib = require('../../lib');

// Same item contract as Get Post, Create Post and the triggers.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'status', 'channelId', 'createdAt'],
    properties: {
        id: { type: 'string', title: 'Post ID', example: '69a1b2c3d4e5f60718293a4b' },
        text: { type: 'string', title: 'Text', example: 'Hello from the Buffer API!' },
        status: { type: 'string', title: 'Status', example: 'scheduled' },
        channelId: { type: 'string', title: 'Channel ID', example: '5f8e1c2b3a4d5e6f7a8b9c0d' },
        channelService: { type: 'string', title: 'Channel Service', example: 'linkedin' },
        dueAt: { type: 'string', format: 'date-time', title: 'Due At', example: '2026-03-10T15:00:00.000Z' },
        sentAt: { type: 'string', format: 'date-time', title: 'Sent At', example: '2026-03-10T15:00:04.000Z' },
        createdAt: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-03-05T14:30:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-03-05T14:31:00.000Z' },
        shareMode: { type: 'string', title: 'Share Mode', example: 'addToQueue' },
        schedulingType: { type: 'string', title: 'Scheduling Type', example: 'automatic' },
        isCustomScheduled: { type: 'boolean', title: 'Is Custom Scheduled', example: false },
        sharedNow: { type: 'boolean', title: 'Shared Now', example: false },
        externalLink: {
            type: 'string',
            title: 'External Link',
            example: 'https://www.linkedin.com/feed/update/urn:li:share:7123456789'
        },
        ideaId: { type: 'string', title: 'Idea ID', example: '6a0b1c2d3e4f5a6b7c8d9e0f' },
        via: { type: 'string', title: 'Via', example: 'api' },
        errorMessage: { type: 'string', title: 'Error Message', example: 'The channel was disconnected.' },
        tags: {
            type: 'array',
            title: 'Tags',
            example: [
                { id: '65f0a1b2c3d4e5f6a7b8c9d0', name: 'Summer sales', color: '#F523F1' }
            ],
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', title: 'Tags.ID', example: '65f0a1b2c3d4e5f6a7b8c9d0' },
                    name: { type: 'string', title: 'Tags.Name', example: 'Summer sales' },
                    color: { type: 'string', title: 'Tags.Color', example: '#F523F1' }
                }
            }
        },
        assets: {
            type: 'array',
            title: 'Assets',
            example: [
                {
                    id: '66a0b1c2d3e4f5a6b7c8d9e0',
                    type: 'image',
                    mimeType: 'image/jpeg',
                    source: 'https://example.com/images/launch.jpg',
                    thumbnail: 'https://example.com/images/launch-thumb.jpg'
                }
            ],
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', title: 'Assets.ID', example: '66a0b1c2d3e4f5a6b7c8d9e0' },
                    type: { type: 'string', title: 'Assets.Type', example: 'image' },
                    mimeType: { type: 'string', title: 'Assets.MIME Type', example: 'image/jpeg' },
                    source: {
                        type: 'string',
                        title: 'Assets.Source',
                        example: 'https://example.com/images/launch.jpg'
                    },
                    thumbnail: {
                        type: 'string',
                        title: 'Assets.Thumbnail',
                        example: 'https://example.com/images/launch-thumb.jpg'
                    }
                }
            }
        }
    }
};

const dateRange = (context, start, end, label) => {

    const range = {};
    const startIso = lib.toIsoDate(context, start, `${label} After`);
    const endIso = lib.toIsoDate(context, end, `${label} Before`);
    if (startIso) {
        range.start = startIso;
    }
    if (endIso) {
        range.end = endIso;
    }
    return Object.keys(range).length ? range : undefined;
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            organizationId,
            channelId,
            status,
            createdAfter,
            createdBefore,
            dueAfter,
            dueBefore,
            sortBy,
            sortDirection,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Posts', value: 'result' });
        }

        if (!organizationId) {
            throw new context.CancelError('Organization is required!');
        }

        const filter = {};
        if (channelId) {
            filter.channelIds = [channelId];
        }
        if (status) {
            filter.status = [status];
        }
        const createdAt = dateRange(context, createdAfter, createdBefore, 'Created');
        if (createdAt) {
            filter.createdAt = createdAt;
        }
        const dueAt = dateRange(context, dueAfter, dueBefore, 'Due');
        if (dueAt) {
            filter.dueAt = dueAt;
        }

        const { posts } = await lib.fetchPostsPage(context, {
            organizationId,
            filter,
            sort: [{ field: sortBy || 'dueAt', direction: sortDirection || 'desc' }]
        });

        if (posts.length === 0) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records: posts });
    }
};
