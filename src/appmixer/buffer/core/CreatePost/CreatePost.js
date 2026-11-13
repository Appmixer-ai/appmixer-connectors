'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            channelId,
            text,
            mode = 'addToQueue',
            dueAt,
            schedulingType = 'automatic',
            saveToDraft,
            imageUrls
        } = context.messages.in.content;

        if (!channelId) {
            throw new context.CancelError('Channel is required!');
        }
        if (!text) {
            throw new context.CancelError('Text is required!');
        }
        if (mode === 'customScheduled' && !dueAt) {
            throw new context.CancelError('Due At is required when Mode is Custom Scheduled!');
        }

        const input = {
            channelId,
            text,
            mode: mode || 'addToQueue',
            schedulingType: schedulingType || 'automatic'
        };
        const dueAtIso = lib.toIsoDate(context, dueAt, 'Due At');
        if (dueAtIso) {
            input.dueAt = dueAtIso;
        }
        if (saveToDraft) {
            input.saveToDraft = true;
        }
        const urls = lib.parseUrlList(imageUrls);
        if (urls.length) {
            input.assets = urls.map(url => ({ image: { url } }));
        }

        const query = `mutation CreatePost($input: CreatePostInput!) {
            createPost(input: $input) {
                __typename
                ... on PostActionSuccess { post { ${lib.POST_FIELDS} } }
                ... on MutationError { message }
            }
        }`;
        const data = await lib.graphql(context, query, { input });
        const result = lib.mutationResult(context, data.createPost, ['PostActionSuccess']);

        return context.sendJson(lib.mapPost(result.post), 'out');
    }
};
