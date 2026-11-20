'use strict';
const { google } = require('googleapis');
const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { fileId, moveToTrash } = context.messages.in.content;
        if (!fileId) {
            throw new context.CancelError('File ID is required!');
        }
        const normalizedFileId = typeof fileId === 'string' ? fileId : fileId.id;

        const auth = lib.getOauth2Client(context.auth);
        const drive = google.drive({ version: 'v3', auth });
        if (moveToTrash === true || moveToTrash === 'true') {
            // Trashing keeps the file object in the change feed, so the DeletedFileOrFolder trigger reports it.
            await drive.files.update({ fileId: normalizedFileId, resource: { trashed: true }, fields: 'id' });
        } else {
            await drive.files.delete({ fileId: normalizedFileId });
        }

        // `googleDriveFileId` is what the out port has always declared; `fileId` is what the component
        // has always emitted. Both are sent so that neither existing flows nor the designer variable break.
        return context.sendJson({ googleDriveFileId: normalizedFileId, fileId: normalizedFileId }, 'out');
    }
};
