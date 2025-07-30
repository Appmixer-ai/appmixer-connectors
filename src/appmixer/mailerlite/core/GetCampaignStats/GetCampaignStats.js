
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { campaign_id } = context.messages.in.content;

        // https://developers.mailerlite.com/docs/#campaigns-reports
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/api/campaigns/{campaign_id}/reports',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
