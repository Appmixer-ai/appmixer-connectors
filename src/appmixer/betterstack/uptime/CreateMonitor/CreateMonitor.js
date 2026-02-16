'use strict';

const BASE_URL = 'https://uptime.betterstack.com/api/v2';

module.exports = {
    async receive(context) {
        const { pronounceableName, url, monitorType, checkFrequency, paused } = context.messages.in.content;

        if (!pronounceableName) {
            throw new context.CancelError('Monitor name is required!');
        }
        if (!url) {
            throw new context.CancelError('Monitor URL is required!');
        }

        const attributes = {
            pronounceable_name: pronounceableName,
            url,
            monitor_type: monitorType || 'status'
        };

        if (checkFrequency) {
            attributes.check_frequency = checkFrequency;
        }
        if (typeof paused === 'boolean') {
            attributes.paused = paused;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/monitors`,
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
