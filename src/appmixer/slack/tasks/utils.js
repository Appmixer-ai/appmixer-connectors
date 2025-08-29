'use strict';

const check = require('check-types');
const _ = require('lodash');
const crypto = require('crypto');

module.exports = context => {

    const Task = require('./SlackTaskModel')(context);
    const Webhook = require('./SlackWebhookModel')(context);

    return {

        /**
         * Generates a hash secret based on approver/requester email
         * @param {string} email
         * @param {string} secret
         * @return {string}
         * @throws Error
         */
        generateSecret: function(email, secret) {

            check.assert.nonEmptyString(email, 'Missing email param.');
            return crypto.createHmac('sha256', secret).update(email).digest('hex');
        },

        /**
         * Verifies task permission.
         * TODO: refactor to use user ID instead of email.
         * @param req
         * @return {Promise<boolean>}
         */
        verifyTaskPerm: async function(req) {

            const { task } = req.pre;
            const { secret } = req.payload || req.query || {};

            if (!task) {
                throw context.http.HttpError.badRequest('Missing task.');
            }

            if (req.pre.user.getEmail() === task.approver) {
                return true;
            }

            if (secret === task.approverSecret) {
                return true;
            }

            throw context.http.HttpError.forbidden();
        },

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
         * Do not return secrets in GET requests.
         * @param {Task} task
         * @throws Error
         */
        omitSecrets: function(task) {

            check.assert.instance(task, Task, 'Invalid Task instance.');
            return _.omit(task, 'approverSecret', 'requesterSecret');
        },

        /**
         * Trigger webhooks for a task.
         * @param {Task} task
         * @return {Promise<void>}
         */
        triggerWebhooks: async function(task) {

            check.assert.instance(task, Task, 'Invalid task instance.');

            const webhooks = await Webhook.find({ taskId: task.getId(), status: 'pending' });
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

