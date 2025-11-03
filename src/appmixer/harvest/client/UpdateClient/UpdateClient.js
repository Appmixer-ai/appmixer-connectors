'use strict';

module.exports = {

    async receive(context) {

        const { clientId, name, isActive, address, currency } = context.messages.in.content;

        if (!clientId) {
            throw new context.CancelError('Client ID is required!');
        }

        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (isActive !== undefined) updateData.is_active = isActive;
        if (address !== undefined) updateData.address = address;
        if (currency !== undefined) updateData.currency = currency;

        const options = {
            method: 'PATCH',
            url: `https://api.harvestapp.com/v2/clients/${clientId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Harvest-Account-Id': context.auth.profileInfo.accountId,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Content-Type': 'application/json'
            },
            data: updateData
        };

        await context.httpRequest(options);

        return context.sendJson({}, 'out');
    }
};
