'use strict';

const lib = require('../lib');

// A tick reads at most this many posts per channel. A larger backlog (after an outage) is
// read on the following ticks, oldest first, so nothing is skipped.
const MAX_POSTS_PER_TICK = 200;

/**
 * Polls messages.getHistory with min_id = last seen post id for every watched channel.
 * Updates are not used: they only arrive for joined channels and are lost while the
 * connection is down, whereas min_id polling also catches up after a restart. The channels
 * are never joined.
 */
module.exports = {

    async start(context) {

        const usernames = lib.parseChannelList(context, context.properties.channels);

        if (!usernames.length) {
            throw new context.CancelError('At least one channel is required!');
        }

        const client = await lib.getClient(context);
        const lastIds = {};

        // Fails the flow start with a clear error for a private, misspelled or
        // non-channel username, and sets the baseline so only posts published from now
        // on are emitted.
        for (const username of usernames) {
            const channel = await lib.resolveChannel(context, client, username);
            lastIds[username.toLowerCase()] = await lib.getLatestMessageId(context, client, channel);
        }

        return context.saveState({ lastIds });
    },

    async tick(context) {

        const usernames = lib.parseChannelList(context, context.properties.channels);
        const client = await lib.getClient(context);
        const previous = (context.state && context.state.lastIds) || {};
        // Only channels still in the configuration are kept.
        const lastIds = {};
        usernames.forEach(username => {
            const key = username.toLowerCase();
            if (previous[key] !== undefined) {
                lastIds[key] = previous[key];
            }
        });

        for (const username of usernames) {
            const key = username.toLowerCase();

            try {
                const channel = await lib.resolveChannel(context, client, username);

                if (lastIds[key] === undefined) {
                    lastIds[key] = await lib.getLatestMessageId(context, client, channel);
                    continue;
                }

                const { messages, chats, lastId } = await lib.getMessagesSince(
                    context,
                    client,
                    channel,
                    lastIds[key],
                    MAX_POSTS_PER_TICK
                );

                for (const message of messages) {
                    const post = lib.formatMessage(message, channel, chats);
                    if (post) {
                        await context.sendJson(post, 'out');
                    }
                }

                lastIds[key] = lastId;
            } catch (error) {
                if (error.floodWait) {
                    // Do not fail the flow - the remaining channels are read on the next tick.
                    await context.log('warn', 'Telegram FLOOD_WAIT, postponing to the next tick.', {
                        seconds: error.floodWait,
                        channel: username
                    });
                    break;
                }
                if (error instanceof context.CancelError) {
                    // One channel going private or being renamed must not stop the others.
                    await context.log('error', error.message, { channel: username });
                    continue;
                }
                throw error;
            } finally {
                // Persist per channel, so posts already sent are not sent again if a
                // later channel fails or the engine restarts mid-tick.
                await context.saveState({ lastIds });
            }
        }

        await context.saveState({ lastIds });
    },

    // Flow Test Mode: emit the newest post of the first channel.
    async test(context) {

        const [username] = lib.parseChannelList(context, context.properties.channels);

        if (!username) {
            throw new context.CancelError('At least one channel is required!');
        }

        const client = await lib.getClient(context);
        const channel = await lib.resolveChannel(context, client, username);
        const { messages, chats } = await lib.getHistory(context, client, channel, { limit: 10 });
        const post = messages.map(message => lib.formatMessage(message, channel, chats)).find(Boolean);

        if (!post) {
            throw new context.CancelError(
                `No posts found in @${username}. The channel may be empty or restricted in your region.`
            );
        }

        return context.sendJson(post, 'out');
    }
};
