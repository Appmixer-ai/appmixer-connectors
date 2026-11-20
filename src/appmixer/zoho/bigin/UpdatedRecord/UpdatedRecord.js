'use strict';

const lib = require('../lib');
const notifications = require('../notifications');

const EVENT_TYPE = 'edit';

// Fields every record carries; the module's standard fields are added by GetRecord's output options.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: lib.COMMON_FIELDS
};

/**
 * Fires when a record is updated in the selected Bigin module.
 * Bigin instant notifications: the channel is enabled in start(), renewed in tick() before it
 * expires (a channel lives at most one day) and disabled in stop().
 */
module.exports = {

    ITEM_SCHEMA,

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
        await notifications.sendRecords(context, ids);
        return context.response();
    },

    async test(context) {

        const record = await notifications.latestRecord(context, 'Modified_Time');
        if (!record) {
            throw new context.CancelError(`No ${context.properties.module} records found to use as test data.`);
        }
        return context.sendJson(record, 'out');
    }
};
