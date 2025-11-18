'use strict';

module.exports = {
    async receive(context) {

        const { name, generation } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        // https://www.twilio.com/docs/sendgrid/api-reference/transactional-templates/create-a-template
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.sendgrid.com/v3/templates',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                name,
                generation
            }
        });

        return context.sendJson(data, 'out');
    }
};
