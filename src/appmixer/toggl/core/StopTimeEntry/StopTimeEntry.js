'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { end } = context.messages.in.content || {};

        const { workspace } = await lib.urls(context);

        try {
            const { data } = await lib.request(context, {
                method: 'POST',
                url: `${workspace}/tracking/stop`,
                data: { end: lib.toTogglTime(context, end, 'End') || new Date().toISOString() }
            });
            return context.sendJson(lib.toTimeEntry(data), 'out');
        } catch (err) {
            // No timer is running: the API answers 400 "User is not tracking time" (404 per its reference).
            const status = err.response && err.response.status;
            const detail = (err.response && err.response.data && err.response.data.error_description) || '';
            if (status === 404 || (status === 400 && /not tracking/i.test(detail))) {
                return context.sendJson({}, 'notFound');
            }
            throw err;
        }
    }
};
