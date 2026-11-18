'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workspace } = await lib.urls(context);

        const { data } = await lib.request(context, {
            method: 'GET',
            url: `${workspace}/tracking/current`
        });

        // The API answers 204 without a body when no timer is running.
        if (!data || !data.id) {
            return context.sendJson({}, 'notFound');
        }

        return context.sendJson(lib.toTimeEntry(data), 'out');
    }
};
