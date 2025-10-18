'use strict';

module.exports = {
    async receive(context) {
        const {
            name,
            subject,
            senderId,
            senderEmail,
            senderName,
            htmlContent } = context.messages.in.content;
        if (!name) {
            throw new context.CancelError('Name is required');
        }

        if (!htmlContent) {
            throw new context.CancelError('HtmlContent is required');
        }

        if (!subject) {
            throw new context.CancelError('Subject is required');
        }


        // https://developers.brevo.com/reference/createemailcampaign-1
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.brevo.com/v3/emailCampaigns',
            headers: {
                'api-key': `${context.auth.apiKey}`
            },
            data: {
                name, htmlContent, subject, sender: {
                    name: senderName || undefined,
                    id: +senderId || undefined,
                    email: senderEmail || undefined
                }
            }
        });

        return context.sendJson(data, 'out');
    }
};
