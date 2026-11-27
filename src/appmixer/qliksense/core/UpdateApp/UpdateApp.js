'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { appId, name, description } = context.messages.in.content;
        if (!appId) {
            throw new context.CancelError('App is required!');
        }
        if (!name && description === undefined) {
            throw new context.CancelError('Enter a Name or a Description to update.');
        }

        const path = '/api/v1/apps/' + encodeURIComponent(appId);
        // PUT replaces both attributes: keep the current value of the one not given.
        const { data: current } = await lib.apiRequest(context, { path });
        const attributes = (current && current.attributes) || {};
        await lib.apiRequest(context, {
            method: 'PUT',
            path,
            data: {
                attributes: {
                    name: name || attributes.name,
                    description: description !== undefined ? description : (attributes.description || '')
                }
            }
        });
        return context.sendJson({}, 'out');
    }
};
