'use strict';

const lib = require('../../lib');
const schema = {
    'uid': { 'type': 'string', 'title': 'Uid' },
    'name': { 'type': 'string', 'title': 'Name' },
    'url': { 'type': 'string', 'title': 'Url' },
    'state': { 'type': 'string', 'title': 'State' }
};

module.exports = {
    async receive(context) {

        const { projectId, state, target, teamId, since, until, outputType } = context.messages.in.content;

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

        // Convert since/until to numbers if they're provided as date strings
        if (since) {
            // Convert ISO date string to timestamp if needed
            const sinceTimestamp = isNaN(since) ? new Date(since).getTime() : Number(since);
            if (!isNaN(sinceTimestamp)) {
                params.append('since', sinceTimestamp);
            }
        }

        if (until) {
            // Convert ISO date string to timestamp if needed
            const untilTimestamp = isNaN(until) ? new Date(until).getTime() : Number(until);
            if (!isNaN(untilTimestamp)) {
                params.append('until', untilTimestamp);
            }
        }

        const url = `https://api.vercel.com/v6/deployments${params.toString() ? '?' + params.toString() : ''}`;

        // https://vercel.com/docs/rest-api/reference/deployments#list-deployments
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        const records = data.deployments || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
