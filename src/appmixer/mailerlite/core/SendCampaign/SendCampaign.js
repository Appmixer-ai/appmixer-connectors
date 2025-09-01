'use strict';

module.exports = {

    async receive(context) {

        const { campaignId } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        // Send campaign instantly using the schedule endpoint with delivery: "instant"
        // https://developers.mailerlite.com/docs/campaigns.html#schedule-a-campaign
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://connect.mailerlite.com/api/campaigns/${campaignId}/schedule`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: {
                delivery: 'instant'
            }
        });

        // Return the campaign data from the response
        return context.sendJson(data.data, 'out');
    }
};
