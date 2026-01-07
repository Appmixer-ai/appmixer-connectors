'use strict';

const lib = require('../lib');

/**
 * Component which triggers whenever an object is deleted.
 * @extends {Component}
 */
module.exports = {

    start(context) {

        const { kmsMasterKeyId, trustedAccountIds } = context.properties;
        const payload = {
            topicPrefix: 'ObjectRemoved_',
            eventPrefix: 's3:ObjectRemoved:',
            eventType: 's3:ObjectRemoved:*',
            kmsMasterKeyId,
            trustedAccountIds
        };
        return lib.registerWebhook(context, payload);
    },

    stop(context) {

        return lib.unregisterWebhook(context);
    },

    /**
     * @param {Context} context
     * @return {*}
     */
    async receive(context) {

        const { bucket } = context.properties;
        const { headers, data } = context.messages.webhook.content;
        const payload = JSON.parse(data);

        if (headers && headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation') {
            return lib.confirmSubscription(context, payload);
        }

        const message = JSON.parse(payload.Message);
        if (Array.isArray(message.Records)) {
            const results = await Promise.allSettled(message.Records.map(async record => {
                const { object } = record.s3;

                if (object) {
                    object.Bucket = bucket;
                    object.EventType = record.eventName;

                    const normalizedObjectKey = decodeURIComponent(object.key.replace(/\+/g, ' '));
                    object.key = normalizedObjectKey;

                    return context.sendJson(object, 'deleted');
                }
            }));

            // Check for any errors after all items have been processed
            const errors = results.filter(result => result.status === 'rejected');
            if (errors.length > 0) {
                throw errors[0].reason;
            }
        }

        return context.response();
    }
};
