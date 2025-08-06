'use strict';

module.exports = {
    async receive(context) {

        const { topic, startTime, duration, password, agenda } = context.messages.in.content;

        // Build request body
        const requestBody = {
            topic,
            start_time: startTime,
            duration,
            password,
            agenda
        };

        // https://developers.zoom.us/docs/api/meetings/#tag/meetings/POST/users/{userId}/meetings
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.zoom.us/v2/users/me/meetings',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
