'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { reloadId } = context.messages.in.content;
        if (!reloadId) {
            throw new context.CancelError('Reload ID is required!');
        }

        await lib.apiRequest(context, {
            method: 'POST',
            path: '/api/v1/reloads/' + encodeURIComponent(reloadId) + '/actions/cancel'
        });
        return context.sendJson({}, 'out');
    }
};
