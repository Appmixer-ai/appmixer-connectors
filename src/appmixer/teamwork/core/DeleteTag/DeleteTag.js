'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { tagId } = context.messages.in.content;
        if (!tagId) {
            throw new context.CancelError('Tag is required!');
        }

        await lib.callAPI(context, 'DELETE', `/projects/api/v3/tags/${encodeURIComponent(tagId)}.json`);

        return context.sendJson({}, 'out');
    }
};
