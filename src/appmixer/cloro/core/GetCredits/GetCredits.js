'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const response = await lib.makeRequest({ context, method: 'GET', path: '/v1/credits' });

        return context.sendJson({
            remaining: response && response.remaining,
            perCycle: response && response.perCycle,
            cycleResetsAt: response && response.cycleResetsAt
        }, 'out');
    }
};
