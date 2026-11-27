'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workbookId } = context.messages.in.content;

        if (!workbookId) {
            throw new context.CancelError('Workbook ID is required!');
        }

        const { data } = await lib.apiRequest(context, { path: '/workbooks/' + lib.encodeId(workbookId) });

        return context.sendJson(lib.mapWorkbook(data.workbook), 'out');
    }
};
