'use strict';

module.exports = (context) => {

    return {
        dueTasksJob: {
            schedule: context.config.dueTasksSchedule || '0 */1 * * * *' // Every minute
        },
        resubmitFailedWebhooksJob: {
            schedule: context.config.failedWebhooksSchedule || '0 */10 * * * *' // Every 10 minutes
        },
        triggerWebhooksConcurrencyLimit: context.config.triggerWebhooksConcurrency || 50
    };
};
