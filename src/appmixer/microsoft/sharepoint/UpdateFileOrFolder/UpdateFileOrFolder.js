'use strict';

module.exports = {

    async receive(context) {

        const { driveId, itemId, newName, folderId } = context.messages.in.content;
        const { accessToken } = context.auth;

        if (!driveId) {
            throw new context.CancelError('Drive ID is required!');
        }
        if (!itemId) {
            throw new context.CancelError('Item ID is required!');
        }
        if (!newName) {
            throw new context.CancelError('New Name is required!');
        }

        const body = { name: newName };
        if (folderId) {
            body.parentReference = { id: folderId };
        }

        await context.httpRequest({
            method: 'PATCH',
            url: `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}`,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            data: body
        });

        return await context.sendJson({}, 'out');
    }
};
