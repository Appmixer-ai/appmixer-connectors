'use strict';

module.exports = (context) => {

    return {
        dueTasksJob: {
            schedule: context.config.dueTasksSchedule || '0 */1 * * * *' // Every minute
        },
        resubmitFailedWebhooksJob: {
            schedule: context.config.failedWebhooksSchedule || '0 */10 * * * *', // Every 10 minutes
            // Delivery attempts (including the first one) before a task with a failing webhook is removed.
            maxAttempts: parseInt(context.config.failedWebhooksMaxAttempts, 10) || 8,
            // Delay before the first retry, doubled with every failed attempt (5, 10, 20 ... minutes).
            backoffBaseMs: parseInt(context.config.failedWebhooksBackoffBaseMs, 10) || 5 * 60 * 1000
        },
        triggerWebhooksConcurrencyLimit: context.config.triggerWebhooksConcurrency || 50
    };
};
