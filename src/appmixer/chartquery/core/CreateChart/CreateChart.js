'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { config } = context.messages.in.content;

        if (!config) {
            throw new context.CancelError('Chart Config is required!');
        }

        let configJson;
        try {
            configJson = JSON.stringify(typeof config === 'string' ? JSON.parse(config) : config);
        } catch (err) {
            throw new context.CancelError('Chart Config must be valid JSON.');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/chart',
            params: {
                query: configJson,
                share: 'true'
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
