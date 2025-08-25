
'use strict';

module.exports = {
    async receive(context) {

        const { name, subject, senderName, fromAddress, content, groups } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Campaign name is required!');
        }
        if (!subject) {
            throw new context.CancelError('Email subject is required!');
        }
        if (!senderName) {
            throw new context.CancelError('Email sender name is required!');
        }
        if (!fromAddress) {
            throw new context.CancelError('Email from address is required!');
        }

        const requestData = {
            name: name,
            type: 'regular',
            emails: [
                {
                    subject: subject,
                    from_name: senderName,
                    from: fromAddress
                }
            ]
        };

        // Add content only if it's not undefined or null
        if (content) {
            requestData.emails[0].content = content;
        }

        // Add optional fields
        if (Array.isArray(groups?.AND) && groups.AND.length > 0) {
            // Extract group IDs from the array of objects
            requestData.groups = groups.AND.map(item => item.groups_item).filter(Boolean);
        }

        // https://developers.mailerlite.com/docs/campaigns.html#create-a-campaign
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://connect.mailerlite.com/api/campaigns',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: requestData
        });

        return context.sendJson(data.data, 'out');
    }
};
