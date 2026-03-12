'use strict';

const api = require('../../api');
const methods = require('./methods.json');

module.exports = {

    async receive(context) {

        const { method, params } = context.messages.in.content;

        if (!method || !api[method]) {
            throw new context.CancelError(`Unknown API method: ${method}`);
        }

        // Parse params - accept JSON string or object
        let parsedParams = {};
        if (params) {
            parsedParams = typeof params === 'string' ? JSON.parse(params) : params;
        }

        const result = await api[method].execute(context, parsedParams);
        return context.sendJson(result, 'out');
    },

    toSelectArray() {

        return Object.entries(methods).map(([name, meta]) => ({
            label: `${meta.method} ${meta.path}`,
            value: name
        }));
    },

    getOutputSchema({ method }) {

        if (!method || !methods[method]) {
            return {};
        }
        return methods[method].outputSchema || {};
    }
};
