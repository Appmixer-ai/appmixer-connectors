'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            customerId,
            userListId,
            userListResourceName,
            email,
            phoneNumber,
            firstName,
            lastName,
            countryCode,
            postalCode,
            mobileId,
            thirdPartyUserId,
            adUserDataConsent,
            adPersonalizationConsent
        } = context.messages.in.content;

        lib.ensureRequired(customerId, 'Customer ID is required!', context);
        lib.getGoogleAdsConfig(context);

        // Resolve user list resource name from either explicit resource name or numeric ID
        const normalizedCustomerId = lib.normalizeCustomerId(customerId);
        const normalizedUserListId = String(userListId || '').replace(/[^0-9]/g, '');

        const resolvedUserListResourceName = userListResourceName
            ? String(userListResourceName)
            : (normalizedUserListId
                ? `customers/${normalizedCustomerId}/userLists/${normalizedUserListId}`
                : null);

        lib.ensureRequired(
            resolvedUserListResourceName,
            'User List ID or User List Resource Name is required!',
            context
        );

        // Build userIdentifiers array - support multiple identifier types
        const userIdentifiers = [];

        if (email) {
            const hashedEmail = lib.hashSha256(email.trim().toLowerCase());
            userIdentifiers.push({ hashedEmail });
        }

        if (phoneNumber) {
            // Normalize phone number and hash
            const normalizedPhone = phoneNumber.replace(/[^0-9+]/g, '').toLowerCase();
            const hashedPhoneNumber = lib.hashSha256(normalizedPhone);
            userIdentifiers.push({ hashedPhoneNumber });
        }

        // Address-based identifier (firstName + lastName + countryCode)
        if (firstName && lastName && countryCode) {
            const addressInfo = {
                hashedFirstName: lib.hashSha256(firstName.trim().toLowerCase()),
                hashedLastName: lib.hashSha256(lastName.trim().toLowerCase()),
                countryCode: countryCode.trim().toUpperCase()
            };
            if (postalCode) {
                addressInfo.postalCode = postalCode.trim();
            }
            userIdentifiers.push({ addressInfo });
        }

        if (mobileId) {
            userIdentifiers.push({ mobileId: mobileId.trim() });
        }

        if (thirdPartyUserId) {
            userIdentifiers.push({ thirdPartyUserId: thirdPartyUserId.trim() });
        }

        // Ensure at least one identifier was provided
        if (userIdentifiers.length === 0) {
            throw new context.CancelError(
                'At least one user identifier is required! Provide email OR phone OR (firstName + lastName + countryCode) OR mobileId OR thirdPartyUserId.'
            );
        }

        // Build the user data for the operation (always 'remove')
        const userData = { userIdentifiers };

        // Consent is optional for 'remove' operations
        if (adUserDataConsent || adPersonalizationConsent) {
            userData.consent = {};
            if (adUserDataConsent) {
                userData.consent.adUserData = adUserDataConsent;
            }
            if (adPersonalizationConsent) {
                userData.consent.adPersonalization = adPersonalizationConsent;
            }
        }

        // Build the CustomerMatchUserListMetadata
        const customerMatchUserListMetadata = {
            userList: resolvedUserListResourceName
        };

        const requestBody = {
            customerMatchUserListMetadata,
            operations: [
                { remove: userData }
            ]
        };

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${lib.API_BASE_URL}/customers/${normalizedCustomerId}:uploadUserData`,
            headers: lib.buildHeaders(context),
            data: requestBody
        });

        return context.sendJson({
            receivedOperationsCount: data.receivedOperationsCount || 0,
            uploadDateTime: data.uploadDateTime || null,
            userListResourceName: resolvedUserListResourceName
        }, 'out');
    }
};
