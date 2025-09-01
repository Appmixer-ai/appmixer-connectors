'use strict';

module.exports = {
    async receive(context) {

        const { meetingId } = context.messages.in.content;

        if (!meetingId) {
            throw new context.CancelError('Meeting ID is required!');
        }

        // https://developers.zoom.us/docs/api/meetings/#tag/meetings/GET/meetings/{meetingId}
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.zoom.us/v2/meetings/${meetingId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
