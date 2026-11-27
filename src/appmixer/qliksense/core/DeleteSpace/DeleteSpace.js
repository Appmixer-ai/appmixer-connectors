'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { spaceId } = context.messages.in.content;
        if (!spaceId) {
            throw new context.CancelError('Space is required!');
        }

        await lib.apiRequest(context, { method: 'DELETE', path: '/api/v1/spaces/' + encodeURIComponent(spaceId) });
        return context.sendJson({}, 'out');
    }
};
