'use strict';

module.exports = {
    async receive(context) {

        const { template_id } = context.messages.in.content;

        if (!template_id) {
            throw new context.CancelError('Template ID is required!');
        }

        // https://www.twilio.com/docs/sendgrid/api-reference/transactional-templates/delete-a-template
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.sendgrid.com/v3/templates/${template_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
