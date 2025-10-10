'use strict';

module.exports = {
    async receive(context) {
        const { tagId } = context.messages.in.content;

        if (!tagId) {
            throw new context.CancelError('Tag ID is required.');
        }

        // https://dev.frontapp.com/reference/delete-tag
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api2.frontapp.com/tags/${tagId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Accept': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
