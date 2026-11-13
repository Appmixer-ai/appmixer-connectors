'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { subscriberId, tagId } = context.messages.in.content;

        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }
        if (!tagId) {
            throw new context.CancelError('Tag is required!');
        }

        await lib.request(context, {
            method: 'POST',
            path: '/fb/subscriber/addTag',
            data: {
                subscriber_id: lib.toApiId(context, subscriberId, 'Subscriber ID'),
                tag_id: lib.toApiId(context, tagId, 'Tag')
            }
        });

        return context.sendJson({ subscriberId: String(subscriberId), tagId: String(tagId) }, 'out');
    }
};
