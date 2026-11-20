'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { postId } = context.messages.in.content;

        if (!postId) {
            throw new context.CancelError('Post ID is required!');
        }

        const query = `mutation DeletePost($input: DeletePostInput!) {
            deletePost(input: $input) {
                __typename
                ... on DeletePostSuccess { id }
                ... on MutationError { message }
            }
        }`;
        const data = await lib.graphql(context, query, { input: { id: postId } });
        lib.mutationResult(context, data.deletePost, ['DeletePostSuccess']);

        return context.sendJson({}, 'out');
    }
};
