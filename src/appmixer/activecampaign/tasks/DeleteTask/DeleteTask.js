'use strict';
const ActiveCampaign = require('../../ActiveCampaign');

module.exports = {

    async receive(context) {

        const {
            taskId
        } = context.messages.in.content;
        if (!taskId) {
            throw new context.CancelError('Task is required');
        }


        const { auth } = context;
        const ac = new ActiveCampaign(auth.url, auth.apiKey, context);

        try {
            await ac.call('delete', `dealTasks/${taskId}`);
        } catch (e) {
            if (e.response.status !== 404) {
                throw (e);
            }
        }

        return context.sendJson({ taskId }, 'out');
    }
};
