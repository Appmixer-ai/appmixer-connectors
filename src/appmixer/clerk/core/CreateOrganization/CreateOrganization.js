/* eslint-disable camelcase */

'use strict';

module.exports = {
    async receive(context) {

        const {
            name,
            slug,
            max_allowed_memberships
        } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Missing required input: name');
        }

        const body = { name, slug, max_allowed_memberships };

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.clerk.com/v1/organizations',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
