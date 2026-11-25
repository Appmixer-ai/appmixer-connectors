'use strict';

const lib = require('../lib');
const notifications = require('../notifications');

const EVENT_TYPE = 'delete';

/**
 * Fires when a record is deleted in the selected Bigin module. The record is gone by then, so the
 * output is its ID and module.
 * Bigin instant notifications: the channel is enabled in start(), renewed in tick() before it
 * expires (a channel lives at most one day) and disabled in stop().
 */
module.exports = {

    async start(context) {

        return notifications.start(context, EVENT_TYPE);
    },

    async stop(context) {

        return notifications.stop(context);
    },

    async tick(context) {

        return notifications.renew(context, EVENT_TYPE);
    },

    async receive(context) {

        if (!context.messages.webhook) {
            return;
        }
        const ids = await notifications.verify(context, EVENT_TYPE);
        if (ids === null) {
            return context.response({ message: 'Unknown notification channel.' }, 403);
        }
        const { server_time: serverTime } = context.messages.webhook.content.data;
        const deletedTime = serverTime ? new Date(Number(serverTime)).toISOString() : new Date().toISOString();
        for (const id of ids) {
            await context.sendJson({ id, module: context.properties.module, deletedTime }, 'out');
        }
        return context.response();
    },

    async test(context) {

        const moduleName = lib.assertModule(context, context.properties.module);
        // Bigin offers no API that returns a deleted record, so there is no real example to emit.
        throw new context.CancelError(
            `There is no deleted ${moduleName} record to use as test data. Start the flow and delete a ` +
            `${moduleName} record in Bigin to fire this trigger.`
        );
    }
};
