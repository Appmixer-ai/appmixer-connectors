
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { campaign_id } = context.messages.in.content;

        if (!campaign_id) {
            throw new context.CancelError('Campaign ID is required!');
        }

        // https://developers.mailerlite.com/docs/#campaigns-send
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://connect.mailerlite.com/api/campaigns/${campaign_id}/actions/send`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson(response.data.data || {}, 'out');
    }
};
