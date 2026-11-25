'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { postId } = context.messages.in.content;

        if (!postId) {
            throw new context.CancelError('Post ID is required!');
        }

        const query = `query Post($input: PostInput!) { post(input: $input) { ${lib.POST_FIELDS} } }`;
        const data = await lib.graphql(context, query, { input: { id: postId } });

        if (!data.post) {
            throw new context.CancelError(`Post ${postId} was not found.`);
        }
        return context.sendJson(lib.mapPost(data.post), 'out');
    }
};
