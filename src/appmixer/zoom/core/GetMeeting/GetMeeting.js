
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { meetingId } = context.messages.in.content;

        if (!meetingId) {
            throw new Error('meetingId is required');
        }

        // https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meeting
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.zoom.us/v2/meetings/${meetingId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson(data, 'out');
    }
};
