'use strict';

const { getPageClient } = require('../../lib');

// A page post ID is "<pageId>_<postId>"; a bare object ID is accepted too.
const POST_ID_PATTERN = /^\d+(_\d+)?$/;
const PAGE_ID_PATTERN = /^\d+$/;

const toTrimmedString = value => (value === undefined || value === null ? '' : String(value).trim());

/**
 * Delete a post published by a Facebook page.
 * A page post can be deleted only with the page access token, not with the user token.
 * https://developers.facebook.com/docs/graph-api/reference/post/#deleting
 */
module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const postId = toTrimmedString(input.postId);
        let pageId = toTrimmedString(input.pageId);

        if (!postId) {
            throw new context.CancelError('Post ID is required!');
        }
        if (!POST_ID_PATTERN.test(postId)) {
            throw new context.CancelError(
                `Invalid Post ID '${postId}'. Use the ID of a page post, for example 107198938765432_122101234567890123.`
            );
        }
        if (!pageId && postId.includes('_')) {
            pageId = postId.split('_')[0];
        }
        if (!pageId) {
            throw new context.CancelError('Page is required when the Post ID does not start with the page ID!');
        }
        if (!PAGE_ID_PATTERN.test(pageId)) {
            throw new context.CancelError(`Invalid Page ID '${pageId}'.`);
        }

        const { client } = await getPageClient(context, pageId);
        await client.delete(`/${postId}`);

        return context.sendJson({}, 'out');
    }
};
