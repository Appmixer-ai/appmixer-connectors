'use strict';

module.exports = {
    async receive(context) {

        const { 
            name, 
            sport_type, 
            start_date_local, 
            elapsed_time, 
            description, 
            distance, 
            trainer, 
            commute 
        } = context.messages.in.content;

        // Validate required fields based on Strava API documentation
        if (!name) {
            throw new context.CancelError('Name is required!');
        }
        if (!sport_type) {
            throw new context.CancelError('Sport Type is required!');
        }
        if (!start_date_local) {
            throw new context.CancelError('Start Date Local is required!');
        }
        if (!elapsed_time) {
            throw new context.CancelError('Elapsed Time is required!');
        }

        // Prepare form data
        const formData = {
            name,
            sport_type,
            start_date_local,
            elapsed_time
        };

        // Add optional fields if provided
        if (description) {
            formData.description = description;
        }
        if (distance) {
            formData.distance = distance;
        }
        if (trainer) {
            formData.trainer = trainer;
        }
        if (commute) {
            formData.commute = commute;
        }

        // Create manual activity using Strava API
        // https://developers.strava.com/docs/reference/#api-Activities-createActivity
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://www.strava.com/api/v3/activities',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: formData
        });

        return context.sendJson(data, 'out');
    }
};
