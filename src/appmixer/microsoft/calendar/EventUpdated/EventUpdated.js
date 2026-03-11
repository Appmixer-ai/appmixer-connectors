'use strict';

const BASE_URL = 'https://graph.microsoft.com/v1.0';
const CLIENT_STATE = 'appmixer.microsoft.calendar';
const RENEW_BEFORE_MS = 300000;

const getSubscriptionExpirationDateTime = () => {
    // Max expiration for calendar subscriptions is 4230 minutes (< 3 days).
    // Renew every 2 days to stay safe.
    return new Date(Date.now() + 3000 * 60 * 1000);
};

module.exports = {

    async start(context) {

        const expirationDateTime = getSubscriptionExpirationDateTime();
        const { data } = await context.httpRequest({
            url: `${BASE_URL}/subscriptions`,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${context.auth?.accessToken || context.accessToken}`,
                'Content-Type': 'application/json',
                accept: 'application/json'
            },
            data: {
                changeType: 'updated',
                notificationUrl: context.getWebhookUrl(),
                resource: '/me/events',
                expirationDateTime: expirationDateTime.toISOString(),
                clientState: CLIENT_STATE
            }
        });

        await context.saveState({ subscriptionId: data.id });
        return context.setTimeout({}, expirationDateTime - Date.now() - RENEW_BEFORE_MS);
    },

    async stop(context) {

        const { subscriptionId } = context.state;
        if (subscriptionId) {
            await context.httpRequest({
                url: `${BASE_URL}/subscriptions/${subscriptionId}`,
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${context.auth?.accessToken || context.accessToken}`
                }
            });
        }
    },

    async receive(context) {

        if (context.messages.timeout) {

            const { subscriptionId } = context.state;
            const expirationDateTime = getSubscriptionExpirationDateTime();

            await context.httpRequest({
                url: `${BASE_URL}/subscriptions/${subscriptionId}`,
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${context.auth?.accessToken || context.accessToken}`,
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                },
                data: { expirationDateTime: expirationDateTime.toISOString() }
            });

            return context.setTimeout({}, expirationDateTime - Date.now() - RENEW_BEFORE_MS);

        } else if (context.messages.webhook) {

            const { data, query } = context.messages.webhook.content;

            if (query.validationToken) {
                return context.response(query.validationToken, 200, { 'Content-type': 'text/plain' });
            }

            const value = data.value || [];
            for (const notification of value) {
                if (notification.clientState === CLIENT_STATE) {
                    try {
                        const { data: event } = await context.httpRequest({
                            url: `https://graph.microsoft.com/v1.0/me/events/${notification.resourceData.id}`,
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${context.auth?.accessToken || context.accessToken}`,
                                accept: 'application/json'
                            }
                        });
                        await context.sendJson(event, 'out');
                    } catch (err) {
                        // Event may no longer exist (e.g. deleted). Log and continue.
                        const resId = notification.resourceData?.id;
                        await context.log({ error: err.message, resId });
                    }
                }
            }

            return context.response('', 200);
        }
    }
};
