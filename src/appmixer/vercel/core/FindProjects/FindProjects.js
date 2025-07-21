'use strict';

const lib = require('../../lib');
const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'framework': { 'type': 'string', 'title': 'Framework' }
};

module.exports = {
    async receive(context) {

        const { search, repoUrl, teamId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Projects', value: 'projects' });
        }

        // Build query parameters
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (repoUrl) params.append('repoUrl', repoUrl);
        if (teamId) params.append('teamId', teamId);

        const url = `https://api.vercel.com/v9/projects${params.toString() ? '?' + params.toString() : ''}`;

        // https://vercel.com/docs/rest-api/reference/projects#list-projects
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        const records = data.projects || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
