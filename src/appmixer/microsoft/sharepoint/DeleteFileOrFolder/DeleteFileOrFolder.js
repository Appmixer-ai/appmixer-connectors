'use strict';

module.exports = {

    async receive(context) {

        const { driveId, itemId } = context.messages.in.content;
        const { accessToken } = context.auth;

        if (!driveId) {
            throw new context.CancelError('Drive ID is required!');
        }
        if (!itemId) {
            throw new context.CancelError('Item ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}`,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        return await context.sendJson({}, 'out');
    }
};
