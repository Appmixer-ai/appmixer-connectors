'use strict';

const { webhookHandler, fetchLatestExample } = require('../../commons');
const ENTITY_NAME = 'Invoice';

module.exports = {

    start: async function(context) {

        const eventName = `${ENTITY_NAME}.Update`;
        const realmId = context.profileInfo.companyId;
        await context.log({ step: 'Registering listener', eventName, realmId });
        // Register a listener so webhook events received via ../../routes.js can be routed
        // to this component by realmId. This is AuthHub-compatible (shared webhook endpoint).
        try {
            await context.addListener(eventName, { realmId });
        } catch (error) {
            // Tolerated: the plugin-route registration below is the effective one (see routes.js).
            await context.log({ step: 'addListener failed', eventName, error: error.message });
        }
        // WORKAROUND (engine 6.6.0): addListener acknowledges but does not persist the
        // listener, so register through the plugin route which writes the registration
        // itself. Remove once the engine persists listeners. See routes.js.
        // The public API origin must come from the component (getWebhookUrl) — the plugin
        // route sees only the internal hostname when called through callAppmixer.
        const apiOrigin = new URL(context.getWebhookUrl()).origin;
        return context.callAppmixer({
            endPoint: '/plugins/appmixer/quickbooks/listeners',
            method: 'POST',
            body: { eventName, realmId, flowId: context.flowId, componentId: context.componentId, apiOrigin }
        });
    },

    stop: async function(context) {

        const eventName = `${ENTITY_NAME}.Update`;
        await context.log({ step: 'Unregistering listener', eventName });
        try {
            await context.removeListener(eventName);
        } catch (error) {
            await context.log({ step: 'removeListener failed', eventName, error: error.message });
        }
        return context.callAppmixer({
            endPoint: '/plugins/appmixer/quickbooks/listeners/remove',
            method: 'POST',
            body: { eventName, flowId: context.flowId, componentId: context.componentId }
        });
    },

    receive: function(context) {

        return webhookHandler(context, ENTITY_NAME);
    },

    test: async function(context) {

        const record = await fetchLatestExample(context, ENTITY_NAME);
        return context.sendJson(record, 'out');
    }
};
