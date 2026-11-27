'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { appId } = context.messages.in.content;
        if (!appId) {
            throw new context.CancelError('App is required!');
        }

        const { data } = await lib.apiRequest(context, { path: '/api/v1/apps/' + encodeURIComponent(appId) });
        return context.sendJson(lib.mapApp(data), 'out');
    }
};
