
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { userId = 'me', topic, start_time, duration, agenda, settings } = context.messages.in.content;

        // Build request body
        const requestBody = {};
        if (topic) requestBody.topic = topic;
        if (start_time) requestBody.start_time = start_time;
        if (duration) requestBody.duration = duration;
        if (agenda) requestBody.agenda = agenda;
        if (settings) {
            requestBody.settings = typeof settings === 'string' ? JSON.parse(settings) : settings;
        }

        // https://marketplace.zoom.us/docs/api-reference/zoom-api/webinar/webinarcreate
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.zoom.us/v2/users/${userId}/webinars`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
