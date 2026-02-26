'use strict';

const lib = require('../../lib');

function parseEmails(value) {
    const raw = String(value || '');
    const items = raw
        .split(/[\n,;]+/)
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);

    return [...new Set(items)];
}

module.exports = {

    async receive(context) {

        const {
            customerId,
            developerToken,
            loginCustomerId,
            offlineUserDataJobId,
            offlineUserDataJobResourceName,
            emails,
            adUserDataConsent,
            adPersonalizationConsent
        } = context.messages.in.content;

        lib.ensureRequired(customerId, 'Customer ID is required!', context);
        lib.ensureRequired(developerToken, 'Developer Token is required!', context);
        lib.ensureRequired(emails, 'Emails are required!', context);

        const normalizedJobId = String(offlineUserDataJobId || '').replace(/[^0-9]/g, '');
        const resolvedOfflineUserDataJobResourceName = offlineUserDataJobResourceName
            ? String(offlineUserDataJobResourceName)
            : (normalizedJobId
                ? `customers/${lib.normalizeCustomerId(customerId)}/offlineUserDataJobs/${normalizedJobId}`
                : null);
        const resolvedOfflineUserDataJobId = normalizedJobId
            || lib.getOfflineUserDataJobIdFromResourceName(resolvedOfflineUserDataJobResourceName);

        lib.ensureRequired(
            resolvedOfflineUserDataJobResourceName,
            'Offline User Data Job ID or Resource Name is required!',
            context
        );
        lib.ensureRequired(
            resolvedOfflineUserDataJobId,
            'Unable to resolve Offline User Data Job ID!',
            context
        );

        const normalizedEmails = parseEmails(emails);

        if (normalizedEmails.length === 0) {
            throw new context.CancelError('No valid emails were provided!');
        }

        const operations = normalizedEmails.map(email => {
            const create = {
                userIdentifiers: [
                    {
                        hashedEmail: lib.hashSha256(email)
                    }
                ]
            };

            if (adUserDataConsent || adPersonalizationConsent) {
                create.consent = {};
                if (adUserDataConsent) {
                    create.consent.adUserData = adUserDataConsent;
                }
                if (adPersonalizationConsent) {
                    create.consent.adPersonalization = adPersonalizationConsent;
                }
            }

            return { create };
        });

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${lib.API_BASE_URL}/customers/${lib.normalizeCustomerId(customerId)}/offlineUserDataJobs/${resolvedOfflineUserDataJobId}:addOperations`,
            headers: lib.buildHeaders(context, { developerToken, loginCustomerId }),
            data: {
                enablePartialFailure: true,
                operations
            }
        });

        return context.sendJson({
            receivedOperations: normalizedEmails.length,
            partialFailureError: data.partialFailureError || null
        }, 'out');
    }
};
