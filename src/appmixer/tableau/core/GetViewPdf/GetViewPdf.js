'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { viewId, pageType, orientation, viewFilters, maxAge, fileName } = context.messages.in.content;

        if (!viewId) {
            throw new context.CancelError('View ID is required!');
        }

        const params = lib.viewFilterParams(context, viewFilters);
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
            path: '/views/' + lib.encodeId(viewId) + '/pdf',
            params,
            fileName: lib.safeFileName(fileName, 'view-' + viewId).replace(/\.pdf$/i, '') + '.pdf'
        });

        return context.sendJson(file, 'out');
    }
};
