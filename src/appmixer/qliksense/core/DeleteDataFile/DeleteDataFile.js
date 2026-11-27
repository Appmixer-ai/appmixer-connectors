'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { dataFileId } = context.messages.in.content;
        if (!dataFileId) {
            throw new context.CancelError('Data File ID is required!');
        }

        await lib.apiRequest(context, { method: 'DELETE', path: '/api/v1/data-files/' + encodeURIComponent(dataFileId) });
        return context.sendJson({}, 'out');
    }
};
