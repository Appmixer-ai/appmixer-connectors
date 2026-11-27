'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { reloadId } = context.messages.in.content;
        if (!reloadId) {
            throw new context.CancelError('Reload ID is required!');
        }

        const { data } = await lib.apiRequest(context, { path: '/api/v1/reloads/' + encodeURIComponent(reloadId) });
        return context.sendJson(lib.mapReload(data), 'out');
    }
};
