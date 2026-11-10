'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const response = await lib.makeRequest({
            context,
            path: '/v1/usage'
        });

        return context.sendJson(response || {}, 'out');
    }
};
