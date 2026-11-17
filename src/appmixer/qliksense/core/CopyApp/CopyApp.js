'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { appId, name, description, spaceId } = context.messages.in.content;
        if (!appId) {
            throw new context.CancelError('App is required!');
        }

        const attributes = {};
        if (name) {
            attributes.name = name;
        }
        if (description) {
            attributes.description = description;
        }
        if (spaceId) {
            attributes.spaceId = spaceId;
        }
        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/api/v1/apps/' + encodeURIComponent(appId) + '/copy',
            data: { attributes }
        });
        return context.sendJson(lib.mapApp(data), 'out');
    }
};
