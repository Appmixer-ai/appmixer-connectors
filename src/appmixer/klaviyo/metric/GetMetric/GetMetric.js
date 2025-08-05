'use strict';

module.exports = {

    async receive(context) {

        const { metricId } = context.messages.in.content;

        if (!metricId) {
            throw new context.CancelError('Metric ID is required!');
        }

        const queryParams = {
            include: 'flow-triggers'
        };

        // https://developers.klaviyo.com/en/reference/get_metric
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://a.klaviyo.com/api/metrics/${metricId}/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            params: queryParams
        });

        return context.sendJson(data.data, 'out');
    }
};
