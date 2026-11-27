'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, description, spaceId } = context.messages.in.content;
        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const attributes = { name };
        if (description) {
            attributes.description = description;
        }
        if (spaceId) {
            attributes.spaceId = spaceId;
        }
        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/api/v1/apps',
            data: { attributes }
        });
        return context.sendJson(lib.mapApp(data), 'out');
    }
};
