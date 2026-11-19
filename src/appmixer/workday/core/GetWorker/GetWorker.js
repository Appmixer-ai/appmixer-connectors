'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workerId } = context.messages.in.content;

        if (!workerId) {
            throw new context.CancelError('Worker ID is required!');
        }

        const id = lib.objectId(context, workerId, 'Worker ID');
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${lib.restBaseUrl(context, lib.COMMON_SERVICE)}/workers/${id}`,
            headers: lib.authHeaders(context)
        });

        return context.sendJson(data, 'out');
    }
};
