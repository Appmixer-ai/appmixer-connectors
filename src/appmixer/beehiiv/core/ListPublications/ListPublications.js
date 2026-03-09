'use strict';

module.exports = {
    async receive(context) {
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.beehiiv.com/v2/publications',
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });

        const publications = response.data.data || [];
        for (const pub of publications) {
            await context.sendJson(pub, 'out');
        }
    },

    toSelectArray(msg) {
        return (msg.data || []).map(pub => ({ label: pub.name, value: pub.id }));
    }
};
