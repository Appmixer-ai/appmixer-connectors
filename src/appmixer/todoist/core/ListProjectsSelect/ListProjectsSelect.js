'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        try {
            const projects = await lib.apiRequest(context, '/projects');

            return context.sendJson(projects, 'out');
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
