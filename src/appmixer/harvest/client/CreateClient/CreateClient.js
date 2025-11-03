'use strict';

module.exports = {

    async receive(context) {

        const {
            name,
            isActive,
            address,
            currency
        } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Client name is required!');
        }

        const data = {
            name
        };

        if (typeof isActive === 'boolean') {
            data.is_active = isActive;
        }

        if (address) {
            data.address = address;
        }

        if (currency) {
            data.currency = currency;
        }

        // https://help.getharvest.com/api-v2/clients-api/clients/clients/#create-a-client
        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.harvestapp.com/v2/clients',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId,
                'Content-Type': 'application/json'
            },
            data
        });

        return context.sendJson(responseData, 'out');
    }
};
