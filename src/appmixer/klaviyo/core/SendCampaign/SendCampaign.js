'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { id, sendTime } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Campaign ID is required!');
        }

        const requestData = {
            data: {
                type: 'campaign-send-job',
                attributes: {
                    ...(sendTime && { send_at: sendTime })
                }
            }
        };

        const response = await context.httpRequest({
            method: 'POST',
            url: `https://a.klaviyo.com/api/campaigns/${id}/send/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        const sendJob = response.data?.data;
        if (!sendJob) {
            throw new context.CancelError('Invalid response from Klaviyo API');
        }

        const outputData = {
            jobId: sendJob.id,
            campaignId: id,
            sentAt: sendTime || 'immediate'
        };

        return context.sendJson(outputData, 'out');
    }
};
