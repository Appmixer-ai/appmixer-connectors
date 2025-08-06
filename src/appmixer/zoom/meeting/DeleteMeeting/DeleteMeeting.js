'use strict';

module.exports = {
    async receive(context) {

        const { meetingId } = context.messages.in.content;

        if (!meetingId) {
            throw new context.CancelError('Meeting ID is required!');
        }

        // https://developers.zoom.us/docs/api/meetings/#tag/meetings/DELETE/meetings/{meetingId}
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.zoom.us/v2/meetings/${meetingId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
