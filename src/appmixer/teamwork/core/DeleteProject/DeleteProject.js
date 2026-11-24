'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { projectId } = context.messages.in.content;
        if (!projectId) {
            throw new context.CancelError('Project is required!');
        }

        await lib.callAPI(context, 'DELETE', `/projects/${encodeURIComponent(projectId)}.json`);

        return context.sendJson({}, 'out');
    }
};
