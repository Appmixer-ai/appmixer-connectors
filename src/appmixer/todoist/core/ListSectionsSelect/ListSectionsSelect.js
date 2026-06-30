'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { projectId } = context.messages.in.content;

        const params = {};
        if (projectId) {
            params.project_id = projectId;
        }

        try {
            const sections = await lib.apiRequest(context, '/sections', { params });

            return context.sendJson(sections, 'out');
        } catch (err) {
            // When used as dynamic source, return empty response instead of error
            if (context.properties.variableFetch) {
                return context.sendJson([], 'out');
            }
            // When used in flow, throw error normally
            context.log({ stage: 'Error', message: err.message, code: err.code });
            throw err;
        }
    }
};
