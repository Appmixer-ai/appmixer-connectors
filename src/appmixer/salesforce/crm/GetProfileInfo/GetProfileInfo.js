'use strict';

module.exports = {
    async receive(context) {

        const instanceId = context.profileInfo.instanceId;

        if (!instanceId) {
            throw new context.CancelError('Instance Id is not set, please authenticate again.');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: instanceId,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
