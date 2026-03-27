'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            customerId,
            name,
            description,
            membershipLifeSpan
        } = context.messages.in.content;

        lib.ensureRequired(customerId, 'Customer ID is required!', context);
        lib.ensureRequired(name, 'Name is required!', context);
        lib.getGoogleAdsConfig(context);

        const create = {
            name,
            crmBasedUserList: {
                uploadKeyType: 'CONTACT_INFO'
            }
        };

        if (description) {
            create.description = description;
        }

        if (membershipLifeSpan !== undefined && membershipLifeSpan !== '') {
            create.membershipLifeSpan = Number(membershipLifeSpan);
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${lib.API_BASE_URL}/customers/${lib.normalizeCustomerId(customerId)}/userLists:mutate`,
            headers: lib.buildHeaders(context),
            data: {
                operations: [
                    { create }
                ]
            }
        });

        return context.sendJson({
            resourceName: data.results?.[0]?.resourceName || null,
            result: data.results?.[0] || null
        }, 'out');
    }
};
