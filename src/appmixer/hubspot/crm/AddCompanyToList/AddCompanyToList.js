'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {

        const {
            listId,
            companyIds
        } = context.messages.in.content;

        if (!listId) {
            throw new context.CancelError('List ID is required!');
        }

        if (!companyIds) {
            throw new context.CancelError('Company IDs are required!');
        }

        // Parse companyIds - handle both comma-separated string and array
        let recordIds = [];
        if (Array.isArray(companyIds)) {
            recordIds = companyIds;
        } else if (typeof companyIds === 'string') {
            recordIds = companyIds.split(',').map(id => id.trim()).filter(id => id);
        }

        if (recordIds.length === 0) {
            throw new context.CancelError('At least one valid company ID is required!');
        }

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        // Try v3 Lists API first
        try {
            const payload = {
                recordIds
            };

            await hs.call('put', `crm/v3/lists/${listId}/memberships/add`, payload);

            return context.sendJson({
                success: true,
                listId,
                companyIds: recordIds,
                count: recordIds.length,
                message: `Successfully added ${recordIds.length} company/companies to list ${listId}`
            }, 'out');

        } catch (error) {
            // If v3 fails, try legacy v1 API as fallback
            if (error.status === 404 || error.status === 400) {
                try {
                    // Legacy v1 API uses different format
                    const legacyPayload = {
                        vids: [],
                        emails: [],
                        ids: recordIds.map(id => parseInt(id))
                    };

                    await hs.call('post', `contacts/v1/lists/${listId}/add`, legacyPayload);

                    return context.sendJson({
                        success: true,
                        listId,
                        companyIds: recordIds,
                        count: recordIds.length,
                        message: `Successfully added ${recordIds.length} company/companies to list ${listId} (via legacy API)`,
                        apiVersion: 'v1'
                    }, 'out');

                } catch (legacyError) {
                    // Both APIs failed
                    throw new Error(`Failed to add companies to list: ${legacyError.message || error.message}`);
                }
            }

            // Re-throw original error if not a 404/400
            throw error;
        }
    }
};

