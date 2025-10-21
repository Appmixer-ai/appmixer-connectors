'use strict';
const ActiveCampaign = require('../../ActiveCampaign');

module.exports = {

    async receive(context) {

        const {
            dealId
        } = context.messages.in.content;
        if (!dealId) {
            throw new context.CancelError('Deal is required');
        }


        const { auth } = context;
        const ac = new ActiveCampaign(auth.url, auth.apiKey, context);

        try {
            await ac.call('delete', `deals/${dealId}`);
        } catch (e) {
            if (e.response.status !== 404) {
                throw (e);
            }
        }

        return context.sendJson({ dealId }, 'out');
    }
};
