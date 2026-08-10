'use strict';

const lib = require('../../lib');

// Schema for a single project item.
const schema = {
    project_id: { type: 'string', title: 'Project ID' },
    name: { type: 'string', title: 'Name' },
    company: { type: 'string', title: 'Company' }
};

module.exports = {

    async receive(context) {

        const { outputType = 'array' } = context.messages.in.content || {};

        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Projects' });
        }

        const { data } = await lib.apiRequest(context, {
            method: 'GET',
            path: '/v1/projects'
        });

        const records = (data && data.projects) || [];

        return lib.sendArrayOutput({ context, records, outputType });
    },

    // Used by the Project dropdown (source) on project-scoped components/triggers.
    toSelectArray({ result }) {
        return (result || []).map(project => ({
            label: project.name ? `${project.name} (${project.project_id})` : project.project_id,
            value: project.project_id
        }));
    }
};
