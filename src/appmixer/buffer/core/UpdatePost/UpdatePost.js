'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { postId, text, mode, dueAt, imageUrls } = context.messages.in.content;

        if (!postId) {
            throw new context.CancelError('Post ID is required!');
        }

        // EditPostInput: an omitted field keeps its current value.
        const input = { id: postId };
        if (text) {
            input.text = text;
        }
        const dueAtIso = lib.toIsoDate(context, dueAt, 'Due At');
        if (dueAtIso) {
            input.dueAt = dueAtIso;
        }
        if (mode) {
            input.mode = mode;
        } else if (dueAtIso) {
            // A new time alone means "publish at this time".
            input.mode = 'customScheduled';
        }
        if (input.mode === 'customScheduled' && !input.dueAt) {
            throw new context.CancelError('Due At is required when Mode is Custom Scheduled!');
        }
        const urls = lib.parseUrlList(imageUrls);
        if (urls.length) {
            input.assets = urls.map(url => ({ image: { url } }));
        }

        const query = `mutation EditPost($input: EditPostInput!) {
            editPost(input: $input) {
                __typename
                ... on PostActionSuccess { post { id } }
                ... on MutationError { message }
            }
        }`;
        const data = await lib.graphql(context, query, { input });
        lib.mutationResult(context, data.editPost, ['PostActionSuccess']);

        return context.sendJson({}, 'out');
    }
};
