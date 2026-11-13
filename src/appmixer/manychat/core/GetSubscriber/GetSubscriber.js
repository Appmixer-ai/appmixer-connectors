'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { subscriberId } = context.messages.in.content;

        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }

        const subscriber = await lib.request(context, {
            path: '/fb/subscriber/getInfo',
            params: { subscriber_id: lib.toApiId(context, subscriberId, 'Subscriber ID') }
        });

        return context.sendJson(subscriber, 'out');
    }
};
