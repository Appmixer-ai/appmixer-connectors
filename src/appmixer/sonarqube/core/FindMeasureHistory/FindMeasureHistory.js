
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { component, metrics, branch, from, to } = context.messages.in.content;

        // https://sonar.appmixer.cloud/web_api/api/measures/search_history
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/api/measures/search_history',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
