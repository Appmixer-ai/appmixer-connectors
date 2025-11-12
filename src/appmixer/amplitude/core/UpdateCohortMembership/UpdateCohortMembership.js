'use strict';

module.exports = {
    async receive(context) {

        const { cohort_id, id_type, adds, removes } = context.messages.in.content;

        if (!cohort_id) {
            throw new context.CancelError('Cohort ID is required!');
        }

        if (!id_type) {
            throw new context.CancelError('ID Type is required!');
        }

        // Parse comma-separated strings into arrays
        const addsList = adds ? adds.split(',').map(item => item.trim()).filter(item => item) : [];
        const removesList = removes ? removes.split(',').map(item => item.trim()).filter(item => item) : [];

        // Build request payload according to Amplitude API
        const payload = {
            cohort_id: cohort_id,
            'id_type': id_type
        };

        if (addsList.length > 0) {
            payload.add = {
                'AND': [
                    {
                        'OR': addsList
                    }
                ]
            };
        }

        if (removesList.length > 0) {
            payload.remove = {
                'AND': [
                    {
                        'OR': removesList
                    }
                ]
            };
        }

        // https://developers.amplitude.com/docs/behavioral-cohorts-api#update-cohort-membership
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://amplitude.com/api/3/cohorts/membership',
            headers: {
                'Authorization': `Basic ${Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64')}`
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
