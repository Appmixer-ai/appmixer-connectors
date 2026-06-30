'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { projectId } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required.');
        }

        await lib.apiRequest(context, `/projects/${projectId}`, {
            method: 'DELETE'
        });

        return context.sendJson({}, 'out');
    }
};
