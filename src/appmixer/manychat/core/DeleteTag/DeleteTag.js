'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { tagId } = context.messages.in.content;

        if (!tagId) {
            throw new context.CancelError('Tag is required!');
        }

        await lib.request(context, {
            method: 'POST',
            path: '/fb/page/removeTag',
            data: { tag_id: lib.toApiId(context, tagId, 'Tag') }
        });

        return context.sendJson({}, 'out');
    }
};
