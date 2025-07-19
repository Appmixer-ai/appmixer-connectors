'use strict';

module.exports = {
    async receive(context) {

        const { topic, startTime, duration, agenda, password, defaultPasscode } = context.messages.in.content;

        // Build request body
        const requestBody = {
            topic,
            start_time: startTime,
            duration,
            agenda,
            password,
            default_passcode: defaultPasscode
        };

        // https://developers.zoom.us/docs/api/meetings/#tag/webinars/POST/users/{userId}/webinars
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.zoom.us/v2/users/me/webinars`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
