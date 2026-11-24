'use strict';

const { API_BASE_URL, getHeaders } = require('../../lib');

const POST_URN_PATTERN = /^urn:li:(share|ugcPost):\d+$/;

/**
 * Delete a post published by a LinkedIn company page.
 * https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api#delete-posts
 */
module.exports = {

    async receive(context) {

        const { postId } = context.messages.in.content;

        // Accept the URN both plain and URL-encoded (urn%3Ali%3Ashare%3A...).
        let urn = typeof postId === 'string' ? postId.trim() : '';
        try {
            urn = decodeURIComponent(urn);
        } catch (err) {
            // Not URL-encoded; the URN check below rejects anything malformed.
        }
        if (!urn) {
            throw new context.CancelError('Post ID is required!');
        }
        if (!POST_URN_PATTERN.test(urn)) {
            throw new context.CancelError(
                `Invalid post ID '${postId}'. Use the post URN, for example urn:li:share:7241234567890123456.`
            );
        }

        try {
            await context.httpRequest({
                method: 'DELETE',
                url: `${API_BASE_URL}/rest/posts/${encodeURIComponent(urn)}`,
                headers: {
                    ...getHeaders(context),
                    'X-RestLi-Method': 'DELETE'
                }
            });
        } catch (err) {
            if (err.response && err.response.status === 403) {
                const detail = err.response.data && err.response.data.message;
                throw new context.CancelError(
                    `LinkedIn rejected deleting the post ${urn} (403 Forbidden). ` +
                    'Make sure you are an administrator or content administrator of the page that published it ' +
                    'and the account has granted the w_organization_social permission.' +
                    (detail ? ` LinkedIn says: ${detail}` : '')
                );
            }
            throw err;
        }

        return context.sendJson({}, 'out');
    }
};
