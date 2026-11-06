'use strict';
const converters = require('../converters');
const path = require('path');

module.exports = {

    async receive(context) {

        const { fileId } = context.messages.in.content;

        if (!fileId) {
            throw new context.CancelError('File ID is required!');
        }

        const fileInfo = await context.getFileInfo(fileId);
        const newFileName = path.parse(fileInfo.filename).name + '.json';
        const savedFile = await converters.csvToJson(context, { sourceFileId: fileId, newFileName });

        return context.sendJson({
            fileId: savedFile.fileId,
            fileName: savedFile.filename
        }, 'out');
    }
};
