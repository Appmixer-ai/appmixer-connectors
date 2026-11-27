'use strict';

const lib = require('../../lib');

// Send reservations of the connected property to IDeaS RMS: POST /api/public/v1/reservations.
// The processing result comes back later on the plugin route (routes.js) and is sent on to "done";
// see lib.submit() and lib.receiveReply().
module.exports = {

    async receive(context) {

        if (context.messages.webhook) {
            return lib.receiveReply(context, 'reservations');
        }
        if (lib.isEmpty(context.messages.in.content.reservations)) {
            throw new context.CancelError('Reservations is required!');
        }
        const result = await lib.submit(context, 'reservations');
        return context.sendJson(result, 'out');
    }
};
