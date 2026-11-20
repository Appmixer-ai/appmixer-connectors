'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const content = context.messages.in.content;
        const { subscriberId } = content;

        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }

        await lib.request(context, {
            method: 'POST',
            path: '/fb/subscriber/updateSubscriber',
            data: {
                subscriber_id: lib.toApiId(context, subscriberId, 'Subscriber ID'),
                ...lib.contactBody(content)
            }
        });

        return context.sendJson({}, 'out');
    }
};
