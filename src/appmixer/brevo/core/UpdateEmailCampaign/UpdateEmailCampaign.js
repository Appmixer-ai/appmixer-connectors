'use strict';

module.exports = {
    async receive(context) {
        const {
            campaignId,
            name,
            subject,
            senderType,
            senderId,
            senderEmail,
            senderName,
            htmlContent } = context.messages.in.content;
        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required');
        }

        if (!senderType) {
            throw new context.CancelError('Sender Type is required');
        }


        // https://developers.brevo.com/reference/updateemailcampaign
        await context.httpRequest({
            method: 'PUT',
            url: `https://api.brevo.com/v3/emailCampaigns/${campaignId}`,
            headers: {
                'api-key': `${context.auth.apiKey}`
            },
            data: {
                name, htmlContent, subject, sender: {
                    type: senderType,
                    name: senderName || undefined,
                    id: +senderId || undefined,
                    email: senderEmail || undefined
                }
            }
        });

        return context.sendJson({ id: campaignId }, 'out');
    }
};
