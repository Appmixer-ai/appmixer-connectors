'use strict';

const lib = require('../../lib');

module.exports = {

    async tick(context) {

        return lib.pollNewItems(context, 'appointment');
    },

    async test(context) {

        // Flow Test Mode: the newest follow-up, read-only, no state written.
        const { items } = await lib.newestItems(context, 'appointment', 1);
        if (!items.length) {
            throw new context.CancelError('There is no follow-up in SuperOffice yet to use as test data. Create one and test again.');
        }
        return context.sendJson(items[0], 'out');
    }
};
