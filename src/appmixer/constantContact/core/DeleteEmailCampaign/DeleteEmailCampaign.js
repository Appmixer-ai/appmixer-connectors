'use strict';

module.exports = {
    async receive(context) {

        const { campaignId } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Email_Campaigns/deleteEmailCampaign
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.cc.email/v3/emails/${campaignId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
