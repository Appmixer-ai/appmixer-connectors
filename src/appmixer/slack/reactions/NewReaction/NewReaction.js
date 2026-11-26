'use strict';

const { WebClient } = require('@slack/web-api');

/**
 * Reaction name without the surrounding colons (":thumbsup:" -> "thumbsup").
 * @param {string} name
 * @returns {string}
 */
function normalizeReactionName(name) {

    return typeof name === 'string' ? name.trim().replace(/^:+|:+$/g, '') : '';
}

/**
 * Whether a reaction_added event passes the trigger's filters.
 * @param {Object} event
 * @param {{ reaction?: string, channelId?: string }} properties
 * @returns {boolean}
 */
function matches(event, { reaction, channelId } = {}) {

    const wanted = normalizeReactionName(reaction);
    // Skin-tone variants arrive as "thumbsup::skin-tone-2" and match "thumbsup".
    if (wanted && normalizeReactionName(event.reaction).split('::')[0] !== wanted
        && normalizeReactionName(event.reaction) !== wanted) {
        return false;
    }
    if (channelId && event.item?.channel !== channelId) {
        return false;
    }
    return true;
}

module.exports = {

    matches,

    async start(context) {

        const componentName = context.flowDescriptor[context.componentId].label || 'New Reaction';

        if (!context.config?.authToken && !context.config?.usesAuthHub) {
            throw new Error(`Missing Slack configuration for component: ${componentName}. Please configure the "authToken" with a valid Slack App token.`);
        }

        if (!context.config?.signingSecret && !context.config?.usesAuthHub) {
            throw new Error(`Missing Slack configuration for component: ${componentName}. Please configure the "signingSecret" with a valid Slack App signing secret.`);
        }

        return context.addListener('slack_reaction_added', { accessToken: context.auth.accessToken });
    },

    async stop(context) {

        return context.removeListener('slack_reaction_added');
    },

    async receive(context) {

        if (context.messages.webhook) {
            const event = context.messages.webhook.content.data;
            if (!matches(event, context.properties)) {
                return;
            }
            await context.sendJson(event, 'reaction');
        }
    },

    // Flow Test Mode: emit one real reaction of the connected user, reshaped into the reaction_added
    // event receive() emits. reactions.list returns the messages the user reacted to most recently.
    async test(context) {

        const web = new WebClient(context.auth.accessToken);
        const { user_id: userId } = await web.auth.test();
        const { items } = await web.reactions.list({ limit: 100 });

        for (const item of items || []) {
            if (item.type !== 'message' || !item.message) continue;
            for (const reaction of item.message.reactions || []) {
                if (!(reaction.users || []).includes(userId)) continue;
                const event = {
                    type: 'reaction_added',
                    user: userId,
                    reaction: reaction.name,
                    ...(item.message.user ? { item_user: item.message.user } : {}),
                    item: { type: 'message', channel: item.channel, ts: item.message.ts }
                };
                if (matches(event, context.properties)) {
                    return context.sendJson(event, 'reaction');
                }
            }
        }

        throw new context.CancelError('No recent reaction of the connected user matches the trigger settings. Add a reaction in Slack and try again.');
    }
};
