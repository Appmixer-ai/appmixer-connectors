
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { campaign_id } = context.messages.in.content;

        if (!campaign_id) {
            throw new context.CancelError('Campaign ID is required!');
        }

        // https://developers.mailerlite.com/docs/#campaigns-reports
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://connect.mailerlite.com/api/campaigns/${campaign_id}/reports`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data.data, 'out');
    }
};
