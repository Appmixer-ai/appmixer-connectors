'use strict';

module.exports = {

    async receive(context) {

        const { clientId } = context.messages.in.content;

        if (!clientId) {
            throw new context.CancelError('Client ID is required!');
        }

        const options = {
            method: 'GET',
            url: `https://api.harvestapp.com/v2/clients/${clientId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Harvest-Account-Id': context.auth.profileInfo.accountId,
                'User-Agent': 'Appmixer (info@appmixer.ai)'
            }
        };

        const { data } = await context.httpRequest(options);

        return context.sendJson(data, 'out');
    }
};
