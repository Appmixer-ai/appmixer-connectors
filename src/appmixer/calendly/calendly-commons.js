'use strict';

module.exports = {

    /**
     * Get request for calendly.
     * @param {Context} context
     * @param {string} event - should be one of ['invitee.created', 'invitee.canceled', 'invitee_no_show.created', 'invitee_no_show.deleted']

     * @returns {*}
     */
    async registerWebhookSubscription(context, event) {
        const { accessToken, profileInfo: { resource } } = context.auth;
        const url = context.getWebhookUrl();
        context.log({ step: 'registerWebhookSubscription webhookUrl', url });

        try {
            const { data } = await context.httpRequest({
                method: 'POST',
                url: 'https://api.calendly.com/webhook_subscriptions',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                data: {
                    url,
                    events: [event],
                    scope: 'user',
                    user: resource.uri,
                    organization: resource.current_organization
                }
            });
            context.log({ step: 'registerWebhookSubscription response', data });
            return data.resource;
        } catch (error) {
            if (error.response && error.response.status === 409) {
                context.log({ step: 'Webhook already exists, fetching existing subscriptions...' });
                const options = {
                    method: 'GET',
                    url: 'https://api.calendly.com/webhook_subscriptions',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    params: {
                        organization: resource.current_organization,
                        scope: 'user',
                        user: resource.uri
                    }
                };
                const listResponse = await context.httpRequest(options);

                const existing = listResponse.data.collection.find(
                    sub => sub.callback_url === url && sub.events.includes(event)
                );

                if (existing) {
                    context.log({ step: 'found existing webhook', uri: existing.uri });
                    return { uri: existing.uri };
                }

                // If no matching webhook found, throw the original error
                context.log({ step: 'no matching webhook found, rethrowing original error' });
                throw error;

            }
        }
    },

    /**
     * DELETE request for calendly to remove webhook subscription.
     * @param {string} webhookUri
     * @param {Context} context
     * @returns {*}
     */
    async removeWebhookSubscription(webhookUri, context) {
        const { accessToken } = context.auth;

        await context.httpRequest({
            method: 'DELETE',
            url: webhookUri,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
    }
};
