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
        console.log(publications)
        return context.sendArray(publications, 'out');
    },

    toSelectArray(msg) {
        return (Array.isArray(msg) ? msg : []).map(pub => ({ label: pub.name, value: pub.id }));
    }
};
