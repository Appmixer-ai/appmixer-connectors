'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { viewId } = context.messages.in.content;

        if (!viewId) {
            throw new context.CancelError('View ID is required!');
        }

        const { data } = await lib.apiRequest(context, { path: '/views/' + lib.encodeId(viewId) });

        return context.sendJson(lib.mapView(data.view), 'out');
    }
};
