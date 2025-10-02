'use strict';

module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Contact ID is required.');
        }

        // https://dev.frontapp.com/reference
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api2.frontapp.com/contacts/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
