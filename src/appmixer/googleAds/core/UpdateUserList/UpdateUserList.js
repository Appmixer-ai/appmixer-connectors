'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            customerId,
            userListId,
            userListResourceName,
            name,
            description,
            membershipLifeSpan,
            integrationCode
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

        // Build the update object with provided fields
        const update = {
            resourceName: resolvedUserListResourceName
        };

        const updateMaskPaths = [];

        if (name !== undefined && name !== '') {
            update.name = name;
            updateMaskPaths.push('name');
        }

        if (description !== undefined && description !== '') {
            update.description = description;
            updateMaskPaths.push('description');
        }

        if (membershipLifeSpan !== undefined && membershipLifeSpan !== '') {
            update.membershipLifeSpan = Number(membershipLifeSpan);
            updateMaskPaths.push('membership_life_span');
        }

        if (integrationCode !== undefined && integrationCode !== '') {
            update.integrationCode = integrationCode;
            updateMaskPaths.push('integration_code');
        }

        // Ensure at least one field is being updated
        if (updateMaskPaths.length === 0) {
            throw new context.CancelError(
                'At least one field must be provided for update (name, description, membershipLifeSpan, or integrationCode).'
            );
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${lib.API_BASE_URL}/customers/${normalizedCustomerId}/userLists:mutate`,
            headers: lib.buildHeaders(context),
            data: {
                operations: [
                    {
                        update,
                        updateMask: {
                            paths: updateMaskPaths
                        }
                    }
                ]
            }
        });

        const result = data.results?.[0] || {};

        return context.sendJson({
            resourceName: result.resourceName || resolvedUserListResourceName,
            id: result.id || null,
            name: result.name || null,
            description: result.description || null,
            type: result.type || null,
            membershipStatus: result.membershipStatus || null,
            membershipLifeSpan: result.membershipLifeSpan || null,
            integrationCode: result.integrationCode || null
        }, 'out');
    }
};
