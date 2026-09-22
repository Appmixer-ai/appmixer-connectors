'use strict';

const lib = require('../lib');
const subscriptions = require('../subscriptions');
const { makeRequest, statusOf } = require('../commons');
const { chatMessage: ITEM_SCHEMA } = require('../schemas');

// A notification names the message as `teams('..')/channels('19:..@thread.tacv2')/messages('1616..')`,
// followed by `/replies('1616..')` when the message is a reply.
const RESOURCE = /teams\('([^']+)'\)\/channels\('([^']+)'\)\/messages\('([^']+)'\)(?:\/replies\('([^']+)'\))?/;

// How many of the newest messages test() looks through for one the trigger would emit.
const TEST_SAMPLE_SIZE = 20;

/**
 * Read one message. The notification carries no content, and a listing projection can omit
 * fields, so both receive() and test() emit what this returns.
 * @param {object} context
 * @param {object} target - `teamId`, `channelId`, `messageId` and, for a reply, `parentMessageId`
 * @return {Promise<object>}
 */
const fetchMessage = async (context, target) => {

    const { data } = await makeRequest(context, {
        method: 'GET',
        path: lib.messagePath({ location: 'channel', ...target })
    });

    return data;
};

const shouldEmit = (message, { includeReplies = false, ignoreOwnMessages = true }, meId) => {

    if (message.replyToId && !includeReplies) {
        return false;
    }
    return lib.shouldEmitMessage(message, ignoreOwnMessages, meId);
};

module.exports = {

    ITEM_SCHEMA,

    async start(context) {

        const { teamId, channelId } = context.properties;
        if (!teamId || !channelId) {
            throw new context.CancelError('Team and Channel are required!');
        }

        const me = await lib.getMe(context);
        // Needed to recognize the user's own messages later.
        await context.stateSet('meId', me.id);

        return subscriptions.start(context, {
            resource: `/teams/${teamId}/channels/${channelId}/messages`,
            changeType: 'created'
        });
    },

    async stop(context) {

        return subscriptions.stop(context);
    },

    async receive(context) {

        if (context.messages.timeout) {
            return subscriptions.renew(context);
        }

        if (!context.messages.webhook) {
            return;
        }

        if (subscriptions.isValidation(context)) {
            return;
        }

        const { includeReplies = false } = context.properties;
        const meId = await context.stateGet('meId');
        const notifications = context.messages.webhook.content.data?.value || [];

        for (const notification of notifications) {

            // A notification without our secret did not come from this subscription.
            if (!await subscriptions.isOurs(context, notification)) {
                continue;
            }
            if (await subscriptions.handleLifecycle(context, notification)) {
                continue;
            }

            const match = RESOURCE.exec(notification.resource || '');
            if (!match) {
                continue;
            }
            const [, teamId, channelId, rootId, replyId] = match;

            // Graph notifies about replies too; skip them before spending a request.
            if (replyId && !includeReplies) {
                continue;
            }

            let message;
            try {
                message = await fetchMessage(context, replyId
                    ? { teamId, channelId, messageId: replyId, parentMessageId: rootId }
                    : { teamId, channelId, messageId: rootId });
            } catch (error) {
                // Notifications can arrive after the message was deleted.
                if (statusOf(error) === 404) {
                    continue;
                }
                throw error;
            }

            if (shouldEmit(message, context.properties, meId)) {
                await context.sendJson(message, 'out');
            }
        }

        return context.response('', 200);
    },

    async test(context) {

        // Flow Test Mode: no notification fires, so take the newest root message the trigger
        // would emit and send it through the same fetch path receive() uses.
        const { teamId, channelId } = context.properties;
        if (!teamId || !channelId) {
            throw new context.CancelError('Team and Channel are required!');
        }

        const { data } = await makeRequest(context, {
            method: 'GET',
            path: `/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/messages`,
            params: { $top: TEST_SAMPLE_SIZE }
        });
        const me = await lib.getMe(context);
        // The listing holds root messages only, newest first.
        const newest = (data.value || []).find((message) => shouldEmit(message, context.properties, me.id));
        if (!newest) {
            throw new Error('No recent message in the channel to use as test data. System events and, with Ignore Own Messages on, your own messages are skipped.');
        }

        return context.sendJson(await fetchMessage(context, { teamId, channelId, messageId: newest.id }), 'out');
    }
};
