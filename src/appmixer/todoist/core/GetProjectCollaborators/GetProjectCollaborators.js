'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'ID' },
    'email': { 'type': 'string', 'title': 'Email' },
    'name': { 'type': 'string', 'title': 'Name' },
    'full_name': { 'type': 'string', 'title': 'Full Name' },
    'avatar_url': { 'type': 'string', 'title': 'Avatar URL' }
};

module.exports = {

    async receive(context) {

        const { projectId, outputType } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required.');
        }

        if (context.properties.generateOutputPortOptions) {
            return context.sendJson(
                lib.getOutputPortSchema(schema, outputType || 'array'),
                'out'
            );
        }

        const collaborators = await lib.apiRequest(context, `/projects/${projectId}/collaborators`);

        return lib.sendArrayOutput({
            context,
            outputType: outputType || 'array',
            records: collaborators
        });
    }
};
