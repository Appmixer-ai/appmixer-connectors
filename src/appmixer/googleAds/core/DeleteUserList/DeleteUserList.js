'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            customerId,
            loginCustomerId,
            userListId,
            userListResourceName
        } = context.messages.in.content;

        lib.ensureRequired(customerId, 'Customer ID is required!', context);

        // Resolve resource name from either userListId or userListResourceName
        let resourceName = userListResourceName;
        if (!resourceName && userListId) {
            resourceName = `customers/${lib.normalizeCustomerId(customerId)}/userLists/${userListId}`;
        }

        lib.ensureRequired(resourceName, 'User List ID or Resource Name is required!', context);

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${lib.API_BASE_URL}/customers/${lib.normalizeCustomerId(customerId)}/userLists:mutate`,
            headers: lib.buildHeaders(context, { loginCustomerId }),
            data: {
                operations: [
                    { remove: resourceName }
                ]
            }
        });

        return context.sendJson({ }, 'out');
    }
};
