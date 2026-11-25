'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {
    async receive(context) {
        const { taskId } = context.messages.in.content;

        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config, context.httpRequest);

        // https://developers.hubspot.com/docs/api/crm/tasks
        await hs.call('delete', `crm/v3/objects/tasks/${taskId}`);

        return await context.sendJson({}, 'out');
    }
};
