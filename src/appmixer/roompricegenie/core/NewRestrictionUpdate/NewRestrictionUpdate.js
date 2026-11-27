'use strict';

const lib = require('../../lib');

// restrictions.update, RoomPriceGenie to partner
// (https://postman.roompricegenie.com/#2997d50f-3e9f-4de7-9e53-b45a6796edd6). The updates arrive
// through the plugin route (routes.js), which verifies RoomPriceGenie's signature.
module.exports = {

    async start(context) {

        return lib.addUpdateListener(context, lib.RESTRICTIONS_EVENT);
    },

    async stop(context) {

        return lib.removeUpdateListener(context, lib.RESTRICTIONS_EVENT);
    },

    async receive(context) {

        return lib.receiveUpdate(context, lib.RESTRICTIONS_EVENT);
    },

    // Flow Test Mode: RoomPriceGenie has no API to read a restriction update, so there is no real sample.
    async test(context) {

        throw new context.CancelError(lib.NO_TEST_SAMPLE);
    }
};
