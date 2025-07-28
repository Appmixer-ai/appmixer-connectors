'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { profile_id, profile_email, metric_name, properties, time } = context.messages.in.content;

        if (!metric_name) {
            throw new Error('Metric name is required');
        }

        if (!profile_id && !profile_email) {
            throw new Error('Either profile_id or profile_email is required');
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
                            ...(profile_id ? { id: profile_id } : { attributes: { email: profile_email } })
                        }
                    },
                    metric: {
                        data: {
                            type: 'metric',
                            attributes: {
                                name: metric_name
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
            throw new Error('Invalid response from Klaviyo API');
        }

        const outputData = {
            id: event.id || 'unknown',
            metric_name: event.attributes?.metric?.name || metric_name,
            timestamp: event.attributes?.timestamp || new Date().toISOString()
        };

        return context.sendJson(outputData, 'out');
    }
};
