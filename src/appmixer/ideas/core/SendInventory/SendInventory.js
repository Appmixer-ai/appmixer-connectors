'use strict';

const lib = require('../../lib');

// Send the daily inventory of the connected property to IDeaS RMS: POST /api/public/v1/inventories.
// The processing result comes back later on the plugin route (routes.js) and is sent on to "done";
// see lib.submit() and lib.receiveReply().
module.exports = {

    async receive(context) {

        if (context.messages.webhook) {
            return lib.receiveReply(context, 'inventories');
        }
        if (lib.isEmpty(context.messages.in.content.inventories)) {
            throw new context.CancelError('Inventories is required!');
        }
        const result = await lib.submit(context, 'inventories');
        return context.sendJson(result, 'out');
    }
};
