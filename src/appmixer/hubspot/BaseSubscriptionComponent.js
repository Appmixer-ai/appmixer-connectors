'use strict';

const Hubspot = require('./Hubspot');

class BaseSubscriptionComponent {

    constructor(subscriptionType, options = {}) {

        this.subscriptionType = subscriptionType;
        this.hubspot = new Hubspot('', options);
    }

    configureHubspot(context) {

        const { config, auth } = context;
        this.hubspot.setApiKey(config.apiKey);
        this.hubspot.setAppId(config.appId);
        this.hubspot.setToken(auth.accessToken);
    }

    getSubscriptions(context) {

        throw new Error('Must be extended to return subscriptions');
    }

    async ensureWebhook(context) {

        // Skip the check if using AuthHub
        if (context.config.usesAuthHub) {
            return;
        }

        // Check if we have appId and apiKey
        const { appId, apiKey } = context.config;
        if (!appId || !apiKey) {
            throw new context.CancelError('HubSpot appId or apiKey missing in configuration.');
        }

        let webhookConfiguredProperly = false;
        let existingTargetURL = null;
        const targetURL = context.appmixerApiUrl + '/plugins/appmixer/hubspot/events';

        // Use cache to avoid hitting HubSpot API too often
        const cacheKey = 'hubspot_webhook_' + appId;
        let lock;
        try {
            // Only one trigger at a time
            lock = await context.lock(cacheKey);

            const targetURLCached = await context.staticCache.get(cacheKey);
            if (targetURLCached) {
                existingTargetURL = targetURLCached;
            } else {
                // Check webhooks/v3/${appId}/settings
                const { data } = await context.httpRequest({
                    method: 'GET',
                    url: `https://api.hubapi.com/webhooks/v3/${appId}/settings?hapikey=${apiKey}`
                });

                await context.staticCache.set(
                    cacheKey,
                    data?.targetUrl || null,
                    // 1 hour cache by default
                    context.config.webhookTargetURLCacheTTL || (60 * 60 * 1000)
                );

                existingTargetURL = data?.targetUrl;
            }

            if (existingTargetURL) {
                webhookConfiguredProperly = existingTargetURL === targetURL;
            } else {
                webhookConfiguredProperly = false;
            }
        } catch (error) {
            // Axios errors expose the HTTP response in error.response
            const status = error?.response?.status ?? error?.status;
            context.log({ step: 'hubspot-plugin-error', status, code: error.code, error });
            if (status === 404) {
                // Webhook not found, need to register
                context.log({ step: 'hubspot-plugin-webhook-not-found-registering', message: `Registering webhook with target URL ${targetURL}` });
                await this.hubspot.registerWebhook(targetURL);
            } else {
                // Unexpected error - propagate and fail the startup
                context.log({ step: 'hubspot-plugin-error-while-fetching-webhook-settings', status, code: error.code, error, message: `Failed to set up webhook with target URL ${targetURL}` });
                throw new context.CancelError(`Error while fetching webhook settings: ${error.message}`);
            }
        } finally {
            lock?.unlock();
        }
        if (!webhookConfiguredProperly) {
            throw new context.CancelError(`HubSpot webhook not configured properly, wrong target URL. Expected: ${targetURL}, existing: ${existingTargetURL}`);
        }
    }

    async receive(context) {

        throw new Error('Must be extended');
    }

    async start(context) {

        this.configureHubspot(context);

        await this.ensureWebhook(context);

        // Use hub_id from context to differentiate between different HubSpot portals/users.
        const portalId = context.auth?.profileInfo?.hub_id;
        return context.addListener(`${this.subscriptionType}:${portalId}`, { apiKey: context.config.apiKey, appId: context.config.appId });
    }

    async stop(context) {

        this.configureHubspot(context);
        const portalId = context.auth?.profileInfo?.hub_id;
        return context.removeListener(`${this.subscriptionType}:${portalId}`);
    }
}

module.exports = BaseSubscriptionComponent;
