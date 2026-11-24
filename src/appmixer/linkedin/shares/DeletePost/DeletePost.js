'use strict';

const { BASE_URL, VERSION_PATH, VERSION_HEADER } = require('../../constants');

const POST_URN = /^urn:li:(share|ugcPost):\d+$/;

/**
 * Component for deleting a post.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { postId } = context.messages.in.content;

        // Accept the URN both plain and URL-encoded (urn%3Ali%3Ashare%3A...).
        let urn = typeof postId === 'string' ? postId.trim() : '';
        try {
            urn = decodeURIComponent(urn);
        } catch (e) {
            // Not URL-encoded; the URN check below rejects anything malformed.
        }
        if (!urn) {
            throw new context.CancelError('Post ID is required!');
        }
        if (!POST_URN.test(urn)) {
            throw new context.CancelError('Post ID must be a post URN, for example urn:li:share:7241234567890123456.');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `${BASE_URL}${VERSION_PATH}/posts/${encodeURIComponent(urn)}`,
            headers: {
                'X-Restli-Protocol-Version': '2.0.0',
                'X-RestLi-Method': 'DELETE',
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'LinkedIn-Version': VERSION_HEADER
            }
        });

        return context.sendJson({}, 'out');
    }
};
