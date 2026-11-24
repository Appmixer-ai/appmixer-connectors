'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { projectId, annotationId } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project is required!');
        }
        if (!annotationId) {
            throw new context.CancelError('Annotation ID is required!');
        }

        // PostHog has no hard delete for annotations: they are soft-deleted with
        // a PATCH of `deleted: true`, the same as deleting one in the PostHog UI.
        await lib.apiCall(context, {
            method: 'PATCH',
            url: `/api/projects/${projectId}/annotations/${annotationId}/`,
            data: { deleted: true }
        });

        return context.sendJson({}, 'out');
    }
};
