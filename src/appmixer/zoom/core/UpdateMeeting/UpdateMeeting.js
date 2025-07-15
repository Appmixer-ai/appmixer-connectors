
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { meetingId, topic, start_time, duration, password, agenda, settings } = context.messages.in.content;

        if (!meetingId) {
            throw new Error('meetingId is required');
        }

        // Build request body
        const requestBody = {};
        if (topic) requestBody.topic = topic;
        if (start_time) requestBody.start_time = start_time;
        if (duration) requestBody.duration = duration;
        if (password) requestBody.password = password;
        if (agenda) requestBody.agenda = agenda;
        if (settings) {
            requestBody.settings = typeof settings === 'string' ? JSON.parse(settings) : settings;
        }

        // https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingupdate
        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.zoom.us/v2/meetings/${meetingId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        // PATCH may return empty response (204), so return success message with meetingId
        return context.sendJson({ success: true, meetingId, updated: requestBody }, 'out');
    }
};
