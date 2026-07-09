'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { sandboxID, timeout } = context.messages.in.content;

        if (!sandboxID) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        const data = {};
        if (timeout) {
            data.timeout = timeout;
        }

        await context.httpRequest({
            method: 'POST',
            url: `${lib.BASE_URL}/sandboxes/${encodeURIComponent(sandboxID)}/connect`,
            headers: lib.authHeaders(context),
            data
        });

        return context.sendJson({}, 'out');
    }
};
