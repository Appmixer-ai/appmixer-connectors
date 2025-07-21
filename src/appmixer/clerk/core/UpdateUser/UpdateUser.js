
'use strict';

module.exports = {
    async receive(context) {
        const { id, email, firstName, lastName } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Missing required input: id');
        }

        const body = {};
        if (email !== undefined) body.email = email;
        if (firstName !== undefined) body.first_name = firstName;
        if (lastName !== undefined) body.last_name = lastName;

        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.clerk.com/v1/users/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
