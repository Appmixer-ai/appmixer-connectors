'use strict';

module.exports = {
    async receive(context) {

        const { template_id } = context.messages.in.content;

        if (!template_id) {
            throw new context.CancelError('Template Id is required!');
        }

        // https://www.twilio.com/docs/sendgrid/api-reference/transactional-templates/retrieve-a-single-template
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.sendgrid.com/v3/templates/${template_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
