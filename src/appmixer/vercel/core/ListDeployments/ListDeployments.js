'use strict';

const lib = require('../../lib.generated');
const schema = {
    'uid': { 'type': 'string', 'title': 'Uid' },
    'name': { 'type': 'string', 'title': 'Name' },
    'url': { 'type': 'string', 'title': 'Url' },
    'state': { 'type': 'string', 'title': 'State' },
    'created': { 'type': 'number', 'title': 'Created' },
    'target': { 'type': 'string', 'title': 'Target' },
    'projectId': { 'type': 'string', 'title': 'Project Id' }
};

module.exports = {
    async receive(context) {

        const { teamId, projectId, limit, from, to, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, {
                label: 'Deployments',
                value: 'deployments'
            });
        }

        const url = 'https://api.vercel.com/v6/deployments';

        // Build request parameters
        const requestParams = {};
        if (teamId) requestParams.teamId = teamId;
        if (projectId) requestParams.projectId = projectId;
        if (limit) requestParams.limit = limit;
        if (from) requestParams.from = from;
        if (to) requestParams.to = to;

        // https://vercel.com/docs/rest-api/reference/deployments#list-deployments
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            params: requestParams,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        return data;
    }
};
