'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (!context.messages.in.content.limeFileId) {
            throw new context.CancelError('File ID is required!');
        }
        const limeFileId = lib.assertId(context, context.messages.in.content.limeFileId, 'File ID');
        const data = await lib.apiCall(context, { path: '/file/' + limeFileId + '/' });
        return context.sendJson(lib.mapFile(data), 'out');
    }
};
