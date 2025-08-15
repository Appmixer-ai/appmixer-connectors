'use strict';

module.exports = (context) => {

    const querystring = require('querystring');
    const utils = require('./utils.js')(context);
    const Task = require('./SlackTaskModel')(context);
    const Webhook = require('./SlackWebhookModel')(context);
    const { validateSlackSignature } = require('../routes');

    context.http.router.register({
        method: 'GET',
        path: '/tasks/version',
        options: {
            handler: () => ({ version: '1.0' }),
            auth: false
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/tasks/webhooks',
        options: {
            handler: req => {

                const { url, taskId } = req.payload;

                return new Webhook().populate({
                    url,
                    taskId,
                    created: new Date(),
                    status: Webhook.STATUS_PENDING
                }).save();
            },
            validate: {
                payload: context.http.Joi.object({
                    url: context.http.Joi.string().uri().required(),
                    taskId: context.http.Joi.string().required()
                })
            }
        }
    });

    context.http.router.register({
        method: 'DELETE',
        path: '/tasks/webhooks/{webhookId}',
        options: {
            handler: async (req, h) => {
                await Webhook.deleteById(req.params.webhookId);
                return h.response({});
            }
        }
    });

    context.http.router.register({
        method: 'GET',
        path: '/tasks/{taskId}',
        options: {
            handler: async req => {
                const slackUserId = req.query.slackUserId;
                const task = await Task.findById(req.params.taskId);
                // Optionally, add permission checks for Slack users here
                return task.addIsApprover(slackUserId, req.query.secret).toJson();
            },
            auth: false
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/tasks',
        options: {
            handler: async req => {

                context.log('debug', 'slack-plugin-route-tasks-create', req.payload);

                return new Task().populate({
                    ...req.payload,
                    status: Task.STATUS_PENDING,
                    decisionBy: new Date(req.payload.decisionBy),
                    created: new Date()
                }).save();
            },
            validate: {
                payload: context.http.Joi.object({
                    title: context.http.Joi.string().required(),
                    description: context.http.Joi.string(),
                    requester: context.http.Joi.string().required(), // Slack user ID
                    approver: context.http.Joi.string().required(), // Slack user ID
                    channel: context.http.Joi.string().required(), // Slack channel ID
                    decisionBy: context.http.Joi.date().iso()
                })
            }
        }
    });

    context.http.router.register({
        method: 'PUT',
        path: '/tasks/{taskId}',
        options: {
            handler: async req => {
                const task = await Task.findById(req.params.taskId);
                if (req.payload.decisionBy) {
                    req.payload.decisionBy = new Date(req.payload.decisionBy);
                }
                await task.populate(req.payload).save();
                return task.toJson();
            }
        }
    });

    // Receive Slack interactions (e.g., button clicks)
    // From Slack: All apps must, as a minimum, acknowledge the receipt of a valid interaction payload.
    // See https://api.slack.com/interactivity/handling#acknowledgment_response
    context.http.router.register({
        method: 'POST',
        path: '/interactions',
        options: {
            payload: {
                parse: false, // changing this later won't propagate to the server!!
                output: 'data',
                allow: 'application/x-www-form-urlencoded'
            },
            auth: false,
            handler: async (req, h) => {

                const result = {
                    type: typeof req.payload,
                    pType: typeof req.payload.payload,
                    payload: req.payload,
                    pPayload: req.payload.payload
                };
                context.log('info', 'slack-plugin-route-webhook-interaction', result);
                // `req.payload` is a Buffer, so we need to parse it
                const rawBody = req.payload.toString('utf8'); // raw buffer as string
                context.log('info', 'slack-plugin-route-REQ-rawBody', { rawBody });

                // Then parse the payload as query string
                const parsed = querystring.parse(rawBody);
                context.log('info', 'slack-plugin-route-REQ-parsed', { parsed });
                const parsedJson = JSON.parse(parsed.payload);
                context.log('info', 'slack-plugin-route-REQ-parsedJson', { parsedJson });
                // const payload = JSON.parse(parsed.payload);

                // Validate Slack signature
                const sigResult = validateSlackSignature(req, context);
                if (!sigResult.valid) {
                    return sigResult.response(h);
                }

                const { actions, response_url: responseUrl } = parsed;
                const taskId = actions[0].value;
                const action = actions[0].action_id;

                // Edit the Slack message to show the new status by calling the responseUrl
                if (responseUrl) {
                    await context.httpRequest({
                        method: 'POST',
                        url: responseUrl,
                        headers: { 'Content-type': 'application/json' },
                        data: {
                            replace_original: true,
                            text: `Task ${taskId} has been ${action === 'approve_task' ? 'approved' : 'rejected'}.`
                        }
                    });
                }

                return h.response({ text: 'Action received' }).code(200);
            }
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/test3',
        options: {
            auth: false,
            payload: {
                parse: false,
                output: 'data',
                allow: 'application/x-www-form-urlencoded'
            },
            handler: async (req, h) => {
                return processTestPayload(context, req, h, 'test3');
            }
        }
    });
    context.http.router.register({
        method: 'POST',
        path: '/interaction2',
        options: {
            payload: {
                parse: false,
                output: 'data',
                allow: 'application/x-www-form-urlencoded'
            },
            auth: false,
            handler: async (req, h) => {

                const result = {
                    type: typeof req.payload,
                    pType: typeof req.payload.payload,
                    payload: req.payload,
                    pPayload: req.payload.payload
                };
                context.log('info', 'slack-plugin-route-webhook-interaction', result);
                // TODO: fix this, payload is a Buffer
                return h.response(result).code(200);
            }
        }
    });

    function processTestPayload(context, req, h, testName) {
        const result = {
            testName,
            type: typeof req.payload,
            pType: typeof req.payload.payload,
            payload: req.payload,
            pPayload: req.payload.payload
        };
        // log the payload
        context.log('info', 'slack-plugin-route-webhook-test-payload', result);
        return h.response(result).code(200);
    }

    context.http.router.register({
        method: 'PUT',
        path: '/tasks/{taskId}/approve',
        options: {
            handler: async req => {
                const slackUserId = req.query.slackUserId;
                const task = await Task.findById(req.params.taskId);
                // Optionally, add permission checks for Slack users here
                if ([Task.STATUS_REJECTED, Task.STATUS_APPROVED].includes(task.getStatus())) {
                    throw new context.http.HttpError.badRequest(`Cannot approve task, already ${task.getStatus()}`);
                }
                task.setStatus(Task.STATUS_APPROVED);
                task.setDecisionMade(new Date());
                await utils.triggerWebhooks(task);
                await task.save();
                return task.toJson();
            },
            auth: false
        }
    });

    context.http.router.register({
        method: 'PUT',
        path: '/tasks/{taskId}/reject',
        options: {
            handler: async req => {
                const slackUserId = req.query.slackUserId;
                const task = await Task.findById(req.params.taskId);
                // Optionally, add permission checks for Slack users here
                if ([Task.STATUS_REJECTED, Task.STATUS_APPROVED].includes(task.getStatus())) {
                    throw new context.http.HttpError.badRequest(`Cannot reject task, already ${task.getStatus()}`);
                }
                task.setStatus(Task.STATUS_REJECTED);
                task.setDecisionMade(new Date());
                await utils.triggerWebhooks(task);
                await task.save();
                return task.toJson();
            },
            auth: false
        }
    });
};
