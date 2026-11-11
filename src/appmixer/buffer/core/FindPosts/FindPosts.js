'use strict';

const lib = require('../../lib');

// Same item contract as Get Post, Create Post and the triggers.
const ITEM_SCHEMA = require('../../schemas/post.json');

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
