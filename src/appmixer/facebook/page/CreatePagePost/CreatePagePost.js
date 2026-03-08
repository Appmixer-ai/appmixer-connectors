'use strict';

const { FacebookClient } = require('../../lib');

/**
 * Create a post on a Facebook page.
 */
module.exports = {

    async receive(context) {

        const client = new FacebookClient(context);
        const input = context.messages.content.content;
        const { pageId } = input;

        // Get page access token
        const pageDetails = await client.get(`/${pageId}`, { fields: 'access_token,name' });
        client.setAccessToken(pageDetails.access_token);

        const postData = { ...input };
        delete postData.pageId;

        if (postData.scheduled_publish_time) {
            const now = Math.floor(Date.now() / 1000);
            let timestamp = Math.floor(new Date(postData.scheduled_publish_time).getTime() / 1000);

            // Scheduled time must be at least 10 minutes from now
            if (timestamp < (now + 630)) {
                timestamp = now + 630;
            }

            postData.scheduled_publish_time = timestamp;
            postData.published = false;
        }

        const result = await client.post(`/${pageId}/feed`, postData);

        return context.sendJson({
            id: result.id,
            message: postData.message,
            link: postData.link,
            pageId,
            pageName: pageDetails.name
        }, 'newPost');
    }
};
