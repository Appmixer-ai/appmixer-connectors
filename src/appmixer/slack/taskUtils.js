'use strict';

const check = require('check-types');

module.exports = context => {

    const Task = require('./SlackTaskModel')(context);

    return {

        /**
         * Trigger a single webhook.
         * @param {Task} [task]
         * @return {Promise<boolean>}
         */
        triggerWebhook: async function(task) {

            check.assert.instance(task, Task, 'task must be an instance of Task');

            try {
                await context.httpRequest({
                    method: 'POST',
                    url: task.getWebhookUrl(),
                    data: task.toJson()
                });
            } catch (err) {
                task.setStatus(Task.STATUS_ERROR);
                await task.save();
                context.log('error', `[slack-trigger-webhook-error] ${context.utils.Error.stringify(err)}`, { taskId: task.id });
            }
        }
    };
};
