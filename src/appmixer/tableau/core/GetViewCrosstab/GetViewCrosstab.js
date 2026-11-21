'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { viewId, viewFilters, maxAge, fileName } = context.messages.in.content;

        if (!viewId) {
            throw new context.CancelError('View ID is required!');
        }

        const params = lib.viewFilterParams(context, viewFilters);
        if (maxAge) {
            params.maxAge = maxAge;
        }

        const file = await lib.saveBinary(context, {
            path: '/views/' + lib.encodeId(viewId) + '/crosstab/excel',
            params,
            fileName: lib.safeFileName(fileName, 'view-' + viewId).replace(/\.xlsx$/i, '') + '.xlsx'
        });

        return context.sendJson(file, 'out');
    }
};
