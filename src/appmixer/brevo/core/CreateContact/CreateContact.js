'use strict';

module.exports = {
    async receive(context) {
        const { email, emailBlacklisted, smsBlacklisted, listIds, updateEnabled } = context.messages.in.content;
        if (!email) {
            throw new context.CancelError('Email is required');
        }


        // list ID must be type number
        const body = {
            email,
            emailBlacklisted,
            listIds: listIds?.split(',').map(id => +id),
            smsBlacklisted,
            updateEnabled
        };

        // https://developers.brevo.com/reference/createcontact
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.brevo.com/v3/contacts',
            headers: {
                'api-key': `${context.auth.apiKey}`
            },
            data: body
        });

        return context.sendJson({ ...data, email }, 'out');
    }
};
