
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { name, subject, content, groups } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }
        if (!subject) {
            throw new context.CancelError('Subject is required!');
        }

        const requestData = {
            name: name,
            subject: subject
        };

        // Add optional fields
        if (content) {
            requestData.content = content;
        }

        if (groups && groups.AND && Array.isArray(groups.AND) && groups.AND.length > 0) {
            requestData.groups = groups.AND;
        }

        // https://developers.mailerlite.com/docs/#campaigns-create
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://connect.mailerlite.com/api/campaigns',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
