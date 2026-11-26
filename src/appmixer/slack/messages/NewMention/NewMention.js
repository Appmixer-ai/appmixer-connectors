'use strict';

const Entities = require('html-entities').AllHtmlEntities;

module.exports = {

    async start(context) {

        const componentName = context.flowDescriptor[context.componentId].label || 'New Mention';

        if (!context.config?.authToken && !context.config?.usesAuthHub) {
            throw new Error(`Missing Slack configuration for component: ${componentName}. Please configure the "authToken" with a valid Slack App token.`);
        }

        if (!context.config?.signingSecret && !context.config?.usesAuthHub) {
            throw new Error(`Missing Slack configuration for component: ${componentName}. Please configure the "signingSecret" with a valid Slack App signing secret.`);
        }

        return context.addListener('slack_app_mention', { accessToken: context.auth.accessToken });
    },

    async stop(context) {

        return context.removeListener('slack_app_mention');
    },

    async receive(context) {

        if (context.messages.webhook) {
            const event = context.messages.webhook.content.data;
            const { channelId } = context.properties;
            if (channelId && event.channel !== channelId) {
                return;
            }
            if (typeof event.text === 'string') {
                event.text = new Entities().decode(event.text);
            }
            await context.sendJson(event, 'mention');
        }
    },

    // Flow Test Mode: Slack has no Web API method that lists past app_mention events for the
    // scopes this connector uses, so there is no real sample to emit. Do not fabricate one.
    async test(context) {

        throw new context.CancelError(
            'New Mention can only be tested with a real event: start the flow, invite the Slack app to a channel ' +
            'and mention it there (@app-name).'
        );
    }
};
