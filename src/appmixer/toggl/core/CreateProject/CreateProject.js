'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, description, clientId, color, isPrivate, billable } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const body = { name };
        if (description) body.description = description;
        const client = lib.optionalId(context, clientId, 'Client ID');
        if (client) body.client_id = client;
        if (color) body.color = color;
        if (isPrivate === true || isPrivate === 'true') body.private = true;
        if (isPrivate === false || isPrivate === 'false') body.private = false;
        if (billable === true || billable === 'true') body.billable = true;

        const { workspace } = await lib.urls(context);
        const { data } = await lib.request(context, {
            method: 'POST',
            url: `${workspace}/projects`,
            data: body
        });

        return context.sendJson(lib.withoutNulls({
            id: data.id,
            workspace_id: data.workspace_id,
            client_id: data.client_id,
            name: data.name,
            description: data.description,
            private: data.private,
            billable: data.billable,
            color: data.color,
            created_at: data.created_at,
            updated_at: data.updated_at
        }), 'out');
    }
};
