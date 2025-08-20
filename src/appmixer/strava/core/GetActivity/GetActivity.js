
'use strict';

module.exports = {
    async receive(context) {

        const { activityId } = context.messages.in.content;

        // Validate required fields
        if (!activityId) {
            throw new context.CancelError('Activity ID is required!');
        }

        // Get activity by ID using Strava API
        // https://developers.strava.com/docs/reference/#api-Activities-getActivityById
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://www.strava.com/api/v3/activities/${activityId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
