'use strict';

const commons = require('../../commons');
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
            offlineUserDataJobResourceName,
            emails,
            adUserDataConsent,
            adPersonalizationConsent
        } = context.messages.in.content;

        lib.ensureRequired(customerId, 'Customer ID is required!', context);
        lib.ensureRequired(developerToken, 'Developer Token is required!', context);
        lib.ensureRequired(offlineUserDataJobResourceName, 'Offline User Data Job Resource Name is required!', context);
        lib.ensureRequired(emails, 'Emails are required!', context);

        const normalizedEmails = parseEmails(emails);

        if (normalizedEmails.length === 0) {
            throw new context.CancelError('No valid emails were provided!');
        }

        const operations = normalizedEmails.map(email => {
            const create = {
                userIdentifiers: [
                    {
                        hashedEmail: commons.hashSha256(email)
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
            url: `${commons.API_BASE_URL}/customers/${commons.normalizeCustomerId(customerId)}/offlineUserDataJobs:addOperations`,
            headers: commons.buildHeaders(context, { developerToken, loginCustomerId }),
            data: {
                resourceName: offlineUserDataJobResourceName,
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
