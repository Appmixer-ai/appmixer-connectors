'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { subscriberId, flowNs } = context.messages.in.content;

        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }
        if (!flowNs) {
            throw new context.CancelError('Flow is required!');
        }

        await lib.request(context, {
            method: 'POST',
            path: '/fb/sending/sendFlow',
            data: {
                subscriber_id: lib.toApiId(context, subscriberId, 'Subscriber ID'),
                flow_ns: String(flowNs).trim()
            }
        });

        return context.sendJson({ subscriberId: String(subscriberId), flowNs: String(flowNs).trim() }, 'out');
    }
};
