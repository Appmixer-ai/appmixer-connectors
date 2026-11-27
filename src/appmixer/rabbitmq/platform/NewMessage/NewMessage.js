'use strict';

module.exports = {

    async start(context) {

        const {
            componentId,
            flowId,
            properties: { queue, consumerTag, noAck = false, exclusive = false, priority, prefetch,
                streamFilterValue, streamOffset }
        } = context;

        const options = { consumerTag, noAck, exclusive, priority, prefetch };

        // Only a stream takes these, and their presence is what puts the consumer in stream mode.
        if (streamFilterValue || streamOffset) {
            // A numeric offset has to travel as a number, or the broker reads it as a named position and rejects it.
            const offset = /^\d+$/.test(streamOffset ?? '') ? Number(streamOffset) : (streamOffset || 'next');
            options.arguments = { 'x-stream-offset': offset };
            if (streamFilterValue) options.arguments['x-stream-filter'] = streamFilterValue;
            // A stream refuses a consumer without a prefetch, and closes the whole connection on an automatic ack.
            options.prefetch = prefetch || 1;
            options.noAck = false;
        }

        const { channelId } = await context.callAppmixer({
            endPoint: '/plugins/appmixer/rabbitmq/consumers',
            method: 'POST',
            body: {
                auth: context.auth,
                queue,
                options,
                componentId,
                flowId
            }
        });
        return context.stateSet('channelId', channelId);
    },

    async stop(context) {

        const channelId = await context.stateGet('channelId');
        return context.callAppmixer({
            endPoint: `/plugins/appmixer/rabbitmq/consumers/${channelId}`,
            method: 'DELETE'
        });
    },

    async receive(context) {

        if (context.messages.webhook) {
            const data = context.messages.webhook.content.data;
            return context.sendJson(data.warning || data, data.warning ? 'warning' : 'out');
        }
    }
};
