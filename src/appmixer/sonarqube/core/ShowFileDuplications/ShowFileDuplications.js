
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { key } = context.messages.in.content;

        // https://sonar.appmixer.cloud/web_api/api/duplications/show
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/api/duplications/show',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
