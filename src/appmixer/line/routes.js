/* eslint-disable camelcase */
'use strict';

const { createHmac } = require('node:crypto');

module.exports = async context => {

    context.onListenerAdded(async listener => {

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.line.me/v2/bot/channel/webhook/test',
            headers: {
                Authorization: `Bearer ${listener.params.channelAccessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response?.data?.ok === false) {
            throw new Error(response?.data?.error);
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/events',
        options: {
            auth: false,
            handler: async (req, h) => {

                await context.log('info', 'line-plugin-route-webhook-hit', { eventCount: req.payload?.events?.length });
                context.log('trace', 'line-plugin-route-webhook-payload', { payload: req.payload });

                const { events } = req.payload;
                if (!events) {
                    context.log('error', 'line-plugin-route-webhook-event-missing', req.payload);
                    return {};
                }

                for (const event of events) {
                    if (event.type === 'message') {
                        await processMessages(context, event, req);
                    }
                }

                return {};
            }
        }
    });

    async function processMessages(context, event, req) {

        await context.triggerListeners({
            eventName: `line-message-${req.payload.destination}`,
            payload: event,
            filter: listener => {
                return listener.params.userId === req.payload.destination
                    && verifySignature(context, req, listener.params.channelSecret);
            }
        });
    }

    function verifySignature(context, req, channelSecret) {

        const body = req.payload;

        const signature = createHmac('sha256', channelSecret)
            .update(JSON.stringify(body))
            .digest('base64');

        const lineSignature = req.headers['x-line-signature'];

        const valid = signature === lineSignature;

        if (!valid) {
            context.log('error', 'line-plugin-route-webhook-invalid-signature', { signature, lineSignature, payload: req.payload });
        }

        return valid;
    }
};
