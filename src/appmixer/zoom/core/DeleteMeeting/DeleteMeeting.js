
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { meetingId } = context.messages.in.content;

        if (!meetingId) {
            throw new Error('meetingId is required');
        }

        // https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingdelete
        const response = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.zoom.us/v2/meetings/${meetingId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        // DELETE usually returns 204 with no body, so return success confirmation
        return context.sendJson({ success: true, meetingId, deleted: true }, 'out');
    }
};
