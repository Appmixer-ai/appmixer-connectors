'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { appId, spaceId, name, description } = context.messages.in.content;
        if (!appId) {
            throw new context.CancelError('App is required!');
        }
        if (!spaceId) {
            throw new context.CancelError('Space is required!');
        }

        const body = { spaceId };
        const attributes = {};
        if (name) {
            attributes.name = name;
        }
        if (description) {
            attributes.description = description;
        }
        if (Object.keys(attributes).length) {
            body.attributes = attributes;
        }
        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/api/v1/apps/' + encodeURIComponent(appId) + '/publish',
            data: body
        });
        return context.sendJson(lib.mapApp(data), 'out');
    }
};
