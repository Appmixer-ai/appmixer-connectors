'use strict';

module.exports = {

    async start(context) {

        const userId = context.profileInfo.userId;
        // https://api.possible-hen-28246.appmixer.cloud/plugins/appmixer/line/events
        // const componentName = context.flowDescriptor[context.componentId].label || 'Watch Events';

        // if (!context.config?.authToken && !context.config?.usesAuthHub) {
        //     throw new Error(`Missing LINE configuration for component: ${componentName}. Please configure the "authToken" with a valid Slack App token.`);
        // }

        // if (!context.config?.signingSecret && !context.config?.usesAuthHub) {
        //     throw new Error(`Missing LINE configuration for component: ${componentName}. Please configure the "signingSecret" with a valid Slack App signing secret.`);
        // }

        return context.addListener('message', { userId });
    },

    async stop(context) {
        const userId = context.profileInfo.userId;

        return context.removeListener('message', { userId });
    },

    async receive(context) {

        if (context.messages.webhook) {
            context.log({ step: 'receive', message: context.messages.webhook });
            await context.sendJson(context.messages.webhook.content.data, 'out');
        }
    }
};
