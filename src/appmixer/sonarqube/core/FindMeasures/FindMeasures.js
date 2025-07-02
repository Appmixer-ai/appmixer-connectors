
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { metricKeys, projectKeys } = context.messages.in.content;

        // https://sonar.appmixer.cloud/web_api/api/measures/search
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/api/measures/search',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
