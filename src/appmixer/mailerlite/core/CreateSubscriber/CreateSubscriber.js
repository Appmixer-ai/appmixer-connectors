
'use strict';

const lib = require('../../lib.generated');
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

        if (groups && groups.AND && Array.isArray(groups.AND) && groups.AND.length > 0) {
            requestData.groups = groups.AND;
        }

        // https://developers.mailerlite.com/docs/#subscribers
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
