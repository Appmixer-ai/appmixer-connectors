'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { profileId, profileEmail, metricName, properties, time } = context.messages.in.content;

        if (!metricName) {
            throw new context.CancelError('Metric name is required!');
        }

        if (!profileId && !profileEmail) {
            throw new context.CancelError('Either profileId or profileEmail is required!');
        }

        let parsedProperties = {};
        if (properties && typeof properties === 'string') {
            parsedProperties = JSON.parse(properties);
        } else if (properties && typeof properties === 'object') {
            parsedProperties = properties;
        }

        const requestData = {
            data: {
                type: 'event',
                attributes: {
                    profile: {
                        data: {
                            type: 'profile',
                            ...(profileId ? { id: profileId } : { attributes: { email: profileEmail } })
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
                    ...(Object.keys(parsedProperties).length > 0 && { properties: parsedProperties }),
                    ...(time && { time: time })
                }
            }
        };

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://a.klaviyo.com/api/events/',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        const event = response.data?.data;
        if (!event) {
            throw new context.CancelError('Invalid response from Klaviyo API');
        }

        const outputData = {
            id: event.id || 'unknown',
            metricName: event.attributes?.metric?.name || metricName,
            timestamp: event.attributes?.timestamp || new Date().toISOString()
        };

        return context.sendJson(outputData, 'out');
    }
};
