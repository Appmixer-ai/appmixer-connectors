
'use strict';

module.exports = {
    async receive(context) {

        const { email, name, groups } = context.messages.in.content;

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const requestData = {
            email: email
        };

        // Add optional fields
        if (name) {
            requestData.fields = { name: name };
        }

        if (Array.isArray(groups?.AND) && groups.AND.length > 0) {
            // Extract group IDs from the array of objects
            requestData.groups = groups.AND.map(item => item.groups_item).filter(Boolean);
        }

        // https://developers.mailerlite.com/docs/subscribers.html#create-upsert-subscriber
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://connect.mailerlite.com/api/subscribers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: requestData
        });

        return context.sendJson(data.data, 'out');
    }
};
