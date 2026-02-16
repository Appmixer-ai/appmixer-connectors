'use strict';

const BASE_URL = 'https://uptime.betterstack.com/api/v2';

module.exports = {
    async receive(context) {
        const { monitorId, pronounceableName, url, monitorType, checkFrequency, paused } = context.messages.in.content;

        if (!monitorId) {
            throw new context.CancelError('Monitor ID is required!');
        }

        const attributes = {};

        if (pronounceableName) {
            attributes.pronounceable_name = pronounceableName;
        }
        if (url) {
            attributes.url = url;
        }
        if (monitorType) {
            attributes.monitor_type = monitorType;
        }
        if (checkFrequency) {
            attributes.check_frequency = checkFrequency;
        }
        if (typeof paused === 'boolean') {
            attributes.paused = paused;
        }

        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `${BASE_URL}/monitors/${monitorId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                data: {
                    type: 'monitor',
                    attributes
                }
            }
        });

        return context.sendJson({ id: data.data.id, ...data.data.attributes }, 'out');
    }
};
