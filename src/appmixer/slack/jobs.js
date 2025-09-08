'use strict';

// Slack version: uses SlackTaskModel and SlackWebhookModel, expects Slack user IDs.
module.exports = async context => {

    const config = require('./config')(context);
    const Webhook = require('./tasks/SlackWebhookModel')(context);
    const Task = require('./tasks/SlackTaskModel')(context);
    const utils = require('./tasks/utils')(context);
    context.log('info', '[slack-job-due-tasks] CONFIG', { config });

    await context.scheduleJob('slack-due-tasks', config.dueTasksJob.schedule, async () => {
        try {
            const lock = await context.job.lock('slack-tasks-due-tasks');
            try {
                const query = { 'status': 'pending', 'decisionBy': { '$lt': new Date() } };
                const tasks = await Task.find(query);
                const res = await context.utils.P.mapArray(tasks, function(task) {
                    task.setStatus(Task.STATUS_DUE);
                    let webhooksTriggered;
                    return utils.triggerWebhooks(task)
                        .then(result => {
                            webhooksTriggered = result;
                            return task.save();
                        })
                        .then(() => webhooksTriggered);
                }, { concurrency: config.triggerWebhooksConcurrencyLimit });
                const result = {
                    tasks: tasks.length,
                    triggeredWebhooks: res.flat().filter(item => item).length,
                    errors: res.flat().filter(item => !item).length
                };
                context.log('trace', `[slack-job-due-tasks] ${JSON.stringify(result)}`);
            } finally {
                await lock?.unlock();
            }
        } catch (err) {
            if (err.message !== 'locked') {
                context.log('error', `[slack-job-due-tasks-error] ${context.utils.Error.stringify(err)}`);
            }
        }
    });

    await context.scheduleJob('slack-resubmit-failed-webhooks', config.resubmitFailedWebhooksJob.schedule, async () => {
        try {
            const lock = await context.job.lock('slack-tasks-failed-webhooks');
            try {
                const webhooks = await Webhook.find({ status: Webhook.STATUS_FAIL });
                const res = await context.utils.P.mapArray(webhooks, function(webhook) {
                    return utils.triggerWebhook(webhook);
                }, { concurrency: config.triggerWebhooksConcurrencyLimit });
                const result = {
                    webhooks: webhooks.length,
                    success: res.flat().filter(item => item).length,
                    errors: res.flat().filter(item => !item).length
                };
                context.log('info', `Resubmit failed webhooks finished, ${result.success} webhooks triggered, ${result.errors} failed.`);
            } finally {
                await lock?.unlock();
            }
        } catch (err) {
            if (err.message !== 'locked') {
                context.log('error', 'Error resubmitting failed webhooks', context.utils.Error.stringify(err));
            }
        }
    });
};
