'use strict';

const api = require('../../api');
const lib = require('../../lib');

const schema = {
    id: { type: 'string', title: 'Project ID' },
    name: { type: 'string', title: 'Project Name' },
    description: { type: 'string', title: 'Description' },
    url: { type: 'string', title: 'API URL' },
    state: { type: 'string', title: 'State' },
    revision: { type: 'integer', title: 'Revision' },
    visibility: { type: 'string', title: 'Visibility' },
    lastUpdateTime: { type: 'string', title: 'Last Update Time' }
};

module.exports = {

    async receive(context) {

        const { organization, outputType = 'array' } = context.messages.in.content;

        if (!organization) {
            throw new context.CancelError('Organization is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Projects', value: 'result' });
        }

        const data = await api.ListProjects.execute(context, { organization });
        const projects = (data.value || []).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            url: p.url,
            state: p.state,
            revision: p.revision,
            visibility: p.visibility,
            lastUpdateTime: p.lastUpdateTime
        }));

        return lib.sendArrayOutput({ context, outputType, records: projects });
    }
};
