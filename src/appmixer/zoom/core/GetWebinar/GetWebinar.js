'use strict';

module.exports = {
    async receive(context) {

        const { webinarId } = context.messages.in.content;

        // https://developers.zoom.us/docs/api/meetings/#tag/webinars/GET/webinars/{webinarId}
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.zoom.us/v2/webinars/${webinarId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
