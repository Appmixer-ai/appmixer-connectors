'use strict';

module.exports = {
    async receive(context) {
        const { campaignId } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.getresponse.com/v3/campaigns/${campaignId}`,
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
