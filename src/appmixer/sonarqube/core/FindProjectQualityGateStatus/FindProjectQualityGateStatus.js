
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { analysisId, branch, projectId, projectKey, pullRequest } = context.messages.in.content;

        // https://sonar.appmixer.cloud/web_api/api/qualitygates/project_status
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/api/qualitygates/project_status',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
