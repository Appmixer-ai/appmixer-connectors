'use strict';

module.exports = {
    async receive(context) {

        const { campaignId } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        // https://developers-classic.mailerlite.com/reference/campaign-actions-and-triggers
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.mailerlite.com/api/v2/campaigns/${campaignId}/actions/send`,
            headers: {
                'X-MailerLite-ApiKey': context.auth.apiKey
            }
        });

        return context.sendJson(data || {}, 'out');
    }
};
