'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { displayId, quantity, email, requestedFor, workspaceId, customFields } = context.messages.in.content;
        if (!displayId) {
            throw new context.CancelError('Service Item is required!');
        }
        const id = lib.requireId(context, displayId, 'Service Item');

        const body = lib.compact({
            quantity: lib.optionalNumber(context, quantity, 'Quantity'),
            email,
            requested_for: requestedFor,
            workspace_id: lib.optionalId(context, workspaceId, 'Workspace ID'),
            custom_fields: lib.parseCustomFields(context, customFields)
        });

        const { data } = await lib.request(context, {
            method: 'POST',
            path: `/service_catalog/items/${id}/place_request`,
            data: body
        });

        return context.sendJson(lib.withoutNulls(data.service_request), 'out');
    }
};
