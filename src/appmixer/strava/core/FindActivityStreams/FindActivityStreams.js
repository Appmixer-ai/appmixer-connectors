
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { activityId, types } = context.messages.in.content;

        // https://developers.strava.com/docs/reference/#api-Streams-getActivityStreams
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/activities/{id}/streams/{types}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
