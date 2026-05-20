'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { mediaId } = context.messages.in.content;

        if (!mediaId) {
            throw new context.CancelError('Media ID is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'DELETE',
            path: `/${mediaId}`
        });

        return context.sendJson({ success: !!data.success }, 'out');
    }
};
