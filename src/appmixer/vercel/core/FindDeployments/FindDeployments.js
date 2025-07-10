'use strict';

const lib = require('../../lib.generated');
const schema = {
    'uid': { 'type': 'string', 'title': 'Uid' },
    'name': { 'type': 'string', 'title': 'Name' },
    'url': { 'type': 'string', 'title': 'Url' },
    'state': { 'type': 'string', 'title': 'State' }
};

module.exports = {
    async receive(context) {

        const { projectId, state, target, teamId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, {
                label: 'Deployments',
                value: 'deployments'
            });
        }

        // Build query parameters
        const params = new URLSearchParams();
        if (projectId) params.append('projectId', projectId);
        if (state) params.append('state', state);
        if (target) params.append('target', target);
        if (teamId) params.append('teamId', teamId);

        const url = `https://api.vercel.com/v6/deployments${params.toString() ? '?' + params.toString() : ''}`;

        // https://vercel.com/docs/rest-api/reference/deployments#list-deployments
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        const records = data.deployments || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
