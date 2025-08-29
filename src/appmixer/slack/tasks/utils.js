'use strict';

const check = require('check-types');

module.exports = context => {

    const Task = require('./SlackTaskModel')(context);
    const Webhook = require('./SlackWebhookModel')(context);

    return {

        /**
         * Gets task using taskId request parameter.
         * @param req
         * @return {Promise<Task>}
         */
        getTask: async function(req) {

            const { taskId } = req.params;

            if (!taskId) {
                throw context.http.HttpError.badRequest('Missing task ID.');
            }

            const task = await Task.findById(taskId);

            if (!task) {
                throw context.http.HttpError.notFound('Task not found.');
            }

            return task;
        },

        /**
         * Trigger webhooks for a task.
         * @param {Task} task
         * @return {Promise<void>}
         */
        triggerWebhooks: async function(task) {

            check.assert.instance(task, Task, 'Invalid task instance.');

            const webhooks = await Webhook.find({ taskId: task.getId(), status: Webhook.STATUS_PENDING });
            return Promise.all(webhooks.map(webhook => this.triggerWebhook(webhook, task)));
        },

        /**
         * Trigger a single webhook.
         * @param {Webhook} webhook
         * @param {Task} [task]
         * @return {Promise<boolean>}
         */
        triggerWebhook: async function(webhook, task = null) {

            check.assert.instance(webhook, Webhook, 'Invalid webhook instance.');

            task = task || await Task.findById(webhook.getTaskId());

            try {
                await context.httpRequest({
                    method: 'POST',
                    url: webhook.getUrl(),
                    data: task.toJson()
                });
                await webhook.populate({ status: Webhook.STATUS_SENT }).save();
                return true;
            } catch (err) {
                await webhook.populate({ status: Webhook.STATUS_FAIL, error: err.message }).save();
                return false;
            }
        }
    };
};

