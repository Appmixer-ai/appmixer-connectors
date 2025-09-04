'use strict';

module.exports = {

    async start(context) {

        const componentName = context.flowDescriptor[context.componentId].label || 'Watch Events';

        if (!context.config?.authToken && !context.config?.usesAuthHub) {
            throw new Error(`Missing LINE configuration for component: ${componentName}. Please configure the "authToken" with a valid Slack App token.`);
        }

        if (!context.config?.signingSecret && !context.config?.usesAuthHub) {
            throw new Error(`Missing LINE configuration for component: ${componentName}. Please configure the "signingSecret" with a valid Slack App signing secret.`);
        }

        return context.addListener('abc');
    },

    async stop(context) {

        return context.removeListener('abc');
    },

    async receive(context) {

        if (context.messages.webhook) {
            if (context.properties.ignoreBotMessages && context.messages.webhook.content.data.subtype === 'bot_message') {
                // Ignore bot messages.
                return;
            }
            await context.sendJson(context.messages.webhook.content.data, 'message');
        }
    }
};
