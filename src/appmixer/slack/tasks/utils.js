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
         * @param req
         * @return {Promise<boolean>}
         */
        verifyTaskPerm: async function(req) {

            // TODO: unfake
            return true;

            throw context.http.HttpError.forbidden();
        },

        /**
         * Gets task using taskId request parameter.
         * @param req
         * @return {Promise<*>}
         */
        getTask: async function(req) {

            // TODO: unfake
            return {
                id: req.params.taskId,
                title: 'Fake task',
                description: 'Fake task description',
                requester: 'Fake requester',
                approver: 'Fake approver',
                status: 'pending'
            };
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
         * @param {Webhook} webhook
         * @param {Task} [task]
         * @return {Promise<boolean>}
         * @throws Error
         */
        triggerWebhook: async function(webhook, task = null) {

            // TODO: unfake
            console.log('Triggering webhook:', { webhook, task });
            return true;
        },

        /**
         * Trigger webhooks.
         * @param {Task} task
         * @return {Promise<void>}
         * @throws Error
         */
        triggerWebhooks: async function(task) {

            // TODO: unfake
            const webhooks = [];
            return Promise.map(webhooks, webhook => {
                return this.triggerWebhook(webhook, task);
            });
        }
    };
};

