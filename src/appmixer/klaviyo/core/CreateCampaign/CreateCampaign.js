'use strict';

module.exports = {

    async receive(context) {

        const { name, subject, templateId } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Campaign name is required!');
        }

        if (!subject) {
            throw new context.CancelError('Campaign subject is required!');
        }

        const requestData = {
            data: {
                type: 'campaign',
                attributes: {
                    name,
                    subject,
                    from_email: 'your-email@domain.com', // This should be configurable
                    from_name: 'Your Name', // This should be configurable
                    ...(templateId && { template_id: templateId })
                }
            }
        };

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://a.klaviyo.com/api/campaigns/',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        const campaign = response.data.data;
        const outputData = {
            id: campaign.id,
            name: campaign.attributes.name,
            subject: campaign.attributes.subject,
            status: campaign.attributes.status,
            created_at: campaign.attributes.created_at
        };

        return context.sendJson(outputData, 'out');
    }
};
