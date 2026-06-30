'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Section ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'project_id': { 'type': 'string', 'title': 'Project ID' },
    'order': { 'type': 'integer', 'title': 'Order' }
};

module.exports = {

    async receive(context) {

        const { projectId, outputType } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return context.sendJson(
                lib.getOutputPortSchema(schema, outputType || 'array', 'Sections'),
                'out'
            );
        }

        const sections = await lib.apiRequest(context, `/sections?project_id=${projectId}`);

        return lib.sendArrayOutput({
            context,
            outputType: outputType || 'array',
            records: sections
        });
    }
};
