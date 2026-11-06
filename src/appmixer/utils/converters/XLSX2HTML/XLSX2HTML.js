'use strict';
const xlsxHelpers = require('../xlsx-helpers');

module.exports = {

    async receive(context) {

        const { fileId } = context.messages.in.content;

        if (!fileId) {
            throw new context.CancelError('File ID is required!');
        }

        const savedFile = await xlsxHelpers.convertFile(
            context,
            fileId,
            xlsxHelpers.XLSX2Workbook,
            'html',
            'text/html'
        );
        return context.sendJson(savedFile, 'out');
    }
};
