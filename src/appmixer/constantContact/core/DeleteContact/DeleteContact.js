'use strict';

module.exports = {
    async receive(context) {

        const { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.cc.email/v3/contacts/${contactId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
