'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { data } = await lib.request(context, {
            method: 'GET',
            url: `${lib.API_BASE_URL}/me/time_entries/current`
        });

        // The API answers null when no timer is running.
        if (!data || !data.id) {
            return context.sendJson({}, 'notFound');
        }

        return context.sendJson(data, 'out');
    }
};
