'use strict';

const commons = require('../../commons');
const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            customerId,
            developerToken,
            loginCustomerId,
            userListId,
            userListResourceName,
            adUserDataConsent,
            adPersonalizationConsent
        } = context.messages.in.content;

        lib.ensureRequired(customerId, 'Customer ID is required!', context);
        lib.ensureRequired(developerToken, 'Developer Token is required!', context);

        const resolvedUserListResourceName = userListResourceName
            ? String(userListResourceName)
            : (userListId
                ? `customers/${commons.normalizeCustomerId(customerId)}/userLists/${String(userListId).replace(/[^0-9]/g, '')}`
                : null);

        lib.ensureRequired(
            resolvedUserListResourceName,
            'User List ID or User List Resource Name is required!',
            context
        );

        const create = {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
                userList: resolvedUserListResourceName
            }
        };

        if (adUserDataConsent || adPersonalizationConsent) {
            create.customerMatchUserListMetadata.consent = {};
            if (adUserDataConsent) {
                create.customerMatchUserListMetadata.consent.adUserData = adUserDataConsent;
            }
            if (adPersonalizationConsent) {
                create.customerMatchUserListMetadata.consent.adPersonalization = adPersonalizationConsent;
            }
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${commons.API_BASE_URL}/customers/${commons.normalizeCustomerId(customerId)}/offlineUserDataJobs:create`,
            headers: commons.buildHeaders(context, { developerToken, loginCustomerId }),
            data: {
                job: create
            }
        });

        const resourceName = data.resourceName || null;

        return context.sendJson({
            resourceName,
            offlineUserDataJobId: commons.getOfflineUserDataJobIdFromResourceName(resourceName)
        }, 'out');
    }
};
