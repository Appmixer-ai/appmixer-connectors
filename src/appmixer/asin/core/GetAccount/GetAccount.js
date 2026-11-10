'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const response = await lib.makeRequest({
            context,
            path: '/api/v1/account'
        });

        return context.sendJson(response || {}, 'out');
    }
};
