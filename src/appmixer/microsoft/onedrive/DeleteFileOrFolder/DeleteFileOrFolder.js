'use strict';
const oneDriveAPI = require('onedrive-api');
const commons = require('../../microsoft-commons');

module.exports = {

    async receive(context) {

        const { driveId, siteId, groupId, userId, drive, itemId } = context.messages.in.content;
        const { accessToken, profileInfo } = context.auth;

        if (!itemId) {
            throw new context.CancelError('File ID/Folder ID is required!');
        }

        await commons.formatError(async () => {
            return oneDriveAPI.items.delete({
                accessToken,
                itemId,
                drive,
                driveId: driveId || siteId || groupId || userId
            });
        }, `Failed to delete the item "${itemId}" from your OneDrive account (${profileInfo.userPrincipalName}).`);

        return await context.sendJson({}, 'out');
    }
};
