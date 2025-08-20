
'use strict';

module.exports = {
    async receive(context) {

        const { 
            activityId, 
            name, 
            description, 
            sport_type, 
            commute, 
            trainer, 
            hide_from_home, 
            gear_id 
        } = context.messages.in.content;

        // Validate required field
        if (!activityId) {
            throw new context.CancelError('Activity ID is required!');
        }

        // Build the update payload
        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (sport_type) updateData.sport_type = sport_type;
        if (commute !== undefined) updateData.commute = commute;
        if (trainer !== undefined) updateData.trainer = trainer;
        if (hide_from_home !== undefined) updateData.hide_from_home = hide_from_home;
        if (gear_id !== undefined) updateData.gear_id = gear_id;

        // Update activity using Strava API
        // https://developers.strava.com/docs/reference/#api-Activities-updateActivityById
        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://www.strava.com/api/v3/activities/${activityId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: updateData
        });

        return context.sendJson(data, 'out');
    }
};
