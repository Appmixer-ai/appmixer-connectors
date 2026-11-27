'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { viewId, highResolution, viewFilters, maxAge, fileName } = context.messages.in.content;

        if (!viewId) {
            throw new context.CancelError('View ID is required!');
        }

        const params = lib.viewFilterParams(context, viewFilters);
        if (highResolution) {
            params.resolution = 'high';
        }
        if (maxAge) {
            params.maxAge = maxAge;
        }

        const file = await lib.saveBinary(context, {
            path: '/views/' + lib.encodeId(viewId) + '/image',
            params,
            fileName: lib.safeFileName(fileName, 'view-' + viewId).replace(/\.png$/i, '') + '.png'
        });

        return context.sendJson(file, 'out');
    }
};
