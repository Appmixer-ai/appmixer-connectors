'use strict';

const lib = require('../../lib');

// rates.update, RoomPriceGenie to partner
// (https://postman.roompricegenie.com/#62e5ec79-7ab4-4d93-ad78-f7afc96dfac7). The updates arrive
// through the plugin route (routes.js), which verifies RoomPriceGenie's signature.
module.exports = {

    async start(context) {

        return lib.addUpdateListener(context, lib.RATES_EVENT);
    },

    async stop(context) {

        return lib.removeUpdateListener(context, lib.RATES_EVENT);
    },

    async receive(context) {

        return lib.receiveUpdate(context, lib.RATES_EVENT);
    },

    // Flow Test Mode: RoomPriceGenie has no API to read a price update, so there is no real sample.
    async test(context) {

        throw new context.CancelError(lib.NO_TEST_SAMPLE);
    }
};
