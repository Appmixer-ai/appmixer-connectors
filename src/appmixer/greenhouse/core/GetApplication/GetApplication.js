'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { applicationId: rawId } = context.messages.in.content;

        if (!rawId) {
            throw new context.CancelError('Application ID is required!');
        }
        const applicationId = lib.toId(context, rawId, 'Application ID', { required: true });

        const application = await lib.getById(context, '/v3/applications', applicationId, 'Application');
        return context.sendJson(application, 'out');
    }
};
