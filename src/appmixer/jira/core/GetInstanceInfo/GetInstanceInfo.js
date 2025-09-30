'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        // https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-server-info/#api-rest-api-3-serverinfo-get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/rest/api/3/serverInfo',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};