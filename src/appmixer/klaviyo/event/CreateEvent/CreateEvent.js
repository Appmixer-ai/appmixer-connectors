'use strict';

module.exports = {

    async receive(context) {

        const { profileId, metricName, properties, time, uniqueId, value, valueCurrency } = context.messages.in.content;

        if (!metricName) {
            throw new context.CancelError('Metric name is required!');
        }

        if (!profileId) {
            throw new context.CancelError('Profile ID is required!');
        }

        const requestData = {
            data: {
                type: 'event',
                attributes: {
                    time,
                    properties: JSON.parse(properties) || {},
                    unique_id: uniqueId,
                    profile: {
                        data: {
                            type: 'profile',
                            id: profileId
                        }
                    },
                    metric: {
                        data: {
                            type: 'metric',
                            attributes: {
                                name: metricName
                            }
                        }
                    },
                    value: parseFloat(value).toFixed(2) || 0,
                    value_currency: valueCurrency
                }
            }
        };

        // https://developers.klaviyo.com/en/reference/create_event
        await context.httpRequest({
            method: 'POST',
            url: 'https://a.klaviyo.com/api/events',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};
