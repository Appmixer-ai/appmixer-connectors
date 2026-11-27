'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workbookId, pageType, orientation, maxAge, fileName } = context.messages.in.content;

        if (!workbookId) {
            throw new context.CancelError('Workbook ID is required!');
        }

        const params = {};
        if (pageType) {
            params.type = pageType;
        }
        if (orientation) {
            params.orientation = orientation;
        }
        if (maxAge) {
            params.maxAge = maxAge;
        }

        const file = await lib.saveBinary(context, {
            path: '/workbooks/' + lib.encodeId(workbookId) + '/pdf',
            params,
            fileName: lib.safeFileName(fileName, 'workbook-' + workbookId).replace(/\.pdf$/i, '') + '.pdf'
        });

        return context.sendJson(file, 'out');
    }
};
