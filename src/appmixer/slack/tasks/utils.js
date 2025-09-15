'use strict';

const check = require('check-types');

module.exports = context => {

    const Task = require('./SlackTaskModel')(context);

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
                return true;
            } catch (err) {
                return false;
            }
        }
    };
};
