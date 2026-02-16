'use strict';

const BASE_URL = 'https://uptime.betterstack.com/api/v2';

module.exports = {
    async receive(context) {
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/monitors`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const monitors = (data.data || []).map((monitor) => ({ id: monitor.id, ...monitor.attributes }));

        return context.sendJson({
            monitors,
            count: monitors.length
        }, 'out');
    }
};
