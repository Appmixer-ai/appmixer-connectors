'use strict';

module.exports = {
    async receive(context) {

        const {
            webinarId, topic, startTime, duration, agenda, password, defaultPasscode
        } = context.messages.in.content;

        // Build request body
        const requestBody = {
            topic,
            start_time: startTime,
            duration,
            agenda,
            password,
            default_passcode: defaultPasscode
        };

        // https://developers.zoom.us/docs/api/meetings/#tag/webinars/PATCH/webinars/{webinarId}
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.zoom.us/v2/webinars/${webinarId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        return context.sendJson({}, 'out');
    }
};
