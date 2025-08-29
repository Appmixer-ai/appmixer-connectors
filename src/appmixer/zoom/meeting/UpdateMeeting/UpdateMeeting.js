'use strict';

module.exports = {
    async receive(context) {

        const { meetingId, topic, startTime, duration, password, agenda } = context.messages.in.content;

        if (!meetingId) {
            throw new context.CancelError('Meeting ID is required!');
        }

        // Build request body
        const requestBody = {
            topic,
            // start_time MUST be in format 'yyyy-MM-ddTHH:mm:ssZ'
            start_time: startTime ? startTime.replace(/\.\d{3}Z$/, 'Z') : undefined,
            duration,
            password,
            agenda
        };

        // https://developers.zoom.us/docs/api/meetings/#tag/meetings/PATCH/meetings/{meetingId}
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.zoom.us/v2/meetings/${meetingId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        return context.sendJson({}, 'out');
    }
};
