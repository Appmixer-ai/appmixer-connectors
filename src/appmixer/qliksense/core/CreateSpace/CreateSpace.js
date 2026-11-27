'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, type, description } = context.messages.in.content;
        if (!name) {
            throw new context.CancelError('Name is required!');
        }
        if (!type) {
            throw new context.CancelError('Type is required!');
        }

        const body = { name, type };
        if (description) {
            body.description = description;
        }
        const { data } = await lib.apiRequest(context, { method: 'POST', path: '/api/v1/spaces', data: body });
        return context.sendJson(lib.mapSpace(data), 'out');
    }
};
