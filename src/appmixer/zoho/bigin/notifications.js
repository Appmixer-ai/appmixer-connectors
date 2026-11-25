'use strict';

const crypto = require('crypto');
const lib = require('./lib');

// Bigin instant notifications (watch API): https://www.bigin.com/developer/docs/apis/v2/notifications/enable.html
// A channel lives at most one day; Bigin falls back to one hour for a longer expiry. The channel is
// asked for 23 hours and replaced by a new one two hours before it expires (tick()).
const CHANNEL_LIFETIME_MS = 23 * 60 * 60 * 1000;
const RENEW_BEFORE_MS = 2 * 60 * 60 * 1000;

// Operation Bigin sends in the notification body for each event type.
const OPERATIONS = { create: 'insert', edit: 'update', delete: 'delete' };

/**
 * ISO 8601 with an offset, the format Bigin expects for channel_expiry.
 * @param {Date} date
 * @returns {string}
 */
const formatExpiry = date => date.toISOString().replace(/\.\d{3}Z$/, '+00:00');

/**
 * Enables a notification channel for one event of the module.
 * @param {Object} context
 * @param {string} event e.g. 'Contacts.create'
 * @param {string} token Sent back in every notification, checked in verify().
 * @returns {Promise<{ channelId: string, channelExpiry: string }>}
 */
const subscribe = async (context, event, token) => {

    const channelId = `${Date.now()}${crypto.randomInt(1000, 10000)}`;
    const channelExpiry = formatExpiry(new Date(Date.now() + CHANNEL_LIFETIME_MS));
    const body = await lib.request(context, {
        method: 'POST',
        path: '/actions/watch',
        data: {
            watch: [{
                // eslint-disable-next-line camelcase
                channel_id: channelId,
                events: [event],
                // eslint-disable-next-line camelcase
                channel_expiry: channelExpiry,
                // eslint-disable-next-line camelcase
                notify_url: context.getWebhookUrl(),
                token
            }]
        }
    });
    const item = Array.isArray(body.watch) ? body.watch[0] : null;
    if (!item || item.status === 'error') {
        throw new Error(`Bigin refused the notification channel: ${JSON.stringify(item || body)}`);
    }
    const details = item.details?.events?.[0];
    return { channelId, channelExpiry: details?.channel_expiry || channelExpiry };
};

/**
 * Disables a notification channel.
 * @param {Object} context
 * @param {string} channelId
 */
const unsubscribe = async (context, channelId) => {

    // eslint-disable-next-line camelcase
    await lib.request(context, { method: 'DELETE', path: '/actions/watch', params: { channel_ids: channelId } });
};

const eventName = (context, eventType) => `${lib.assertModule(context, context.properties.module)}.${eventType}`;

module.exports = {

    OPERATIONS,
    formatExpiry,

    /**
     * start(): enables the channel and keeps its id, expiry and verification token in the state.
     * @param {Object} context
     * @param {'create'|'edit'|'delete'} eventType
     */
    async start(context, eventType) {

        const token = crypto.randomBytes(16).toString('hex');
        const { channelId, channelExpiry } = await subscribe(context, eventName(context, eventType), token);
        return context.saveState({ channelId, channelExpiry, token });
    },

    /**
     * stop(): disables the channel.
     * @param {Object} context
     */
    async stop(context) {

        const { channelId } = await context.loadState();
        if (channelId) {
            await unsubscribe(context, channelId);
        }
    },

    /**
     * tick(): replaces the channel with a new one before it expires.
     * @param {Object} context
     * @param {'create'|'edit'|'delete'} eventType
     */
    async renew(context, eventType) {

        let lock;
        try {
            lock = await context.lock(context.componentId, { ttl: 60 * 1000, maxRetryCount: 0 });
        } catch (err) {
            // Another tick is renewing the channel.
            return;
        }
        try {
            const state = await context.loadState();
            if (!state.channelId || Date.parse(state.channelExpiry) - Date.now() > RENEW_BEFORE_MS) {
                return;
            }
            // The new channel first, then the old one off: no notification is lost in between.
            const { channelId, channelExpiry } = await subscribe(context, eventName(context, eventType), state.token);
            await context.saveState({ ...state, channelId, channelExpiry, previousChannelId: state.channelId });
            try {
                await unsubscribe(context, state.channelId);
            } catch (err) {
                // The old channel expires on its own within two hours.
                await context.log({ step: 'Could not disable the previous notification channel', error: err.message });
            }
        } finally {
            await lock.unlock();
        }
    },

    /**
     * receive(): checks the notification came from this trigger's channel (token + channel id)
     * and returns the ids of the records it is about, or null when it is not ours.
     * @param {Object} context
     * @param {'create'|'edit'|'delete'} eventType
     * @returns {Promise<Array<string>|null>} Record ids, [] for a notification of another event.
     */
    async verify(context, eventType) {

        const payload = context.messages.webhook.content.data || {};
        const state = await context.loadState();
        const knownChannel = [state.channelId, state.previousChannelId].includes(String(payload.channel_id));
        if (!state.token || payload.token !== state.token || !knownChannel) {
            return null;
        }
        if (payload.operation !== OPERATIONS[eventType] || payload.module !== context.properties.module) {
            return [];
        }
        return Array.isArray(payload.ids) ? payload.ids.map(String) : [];
    },

    /**
     * Sends the current version of each record (created/updated triggers). A record deleted before
     * it could be read is skipped.
     * @param {Object} context
     * @param {Array<string>} ids
     */
    async sendRecords(context, ids) {

        const moduleName = context.properties.module;
        for (const id of ids) {
            let record;
            try {
                record = await lib.getRecord(context, moduleName, id);
            } catch (err) {
                await context.log({ step: 'Record could not be read, skipped', id, error: err.message });
                continue;
            }
            await context.sendJson(record, 'out');
        }
    },

    /**
     * Flow Test Mode: the newest record of the module by the given time field (read only).
     * @param {Object} context
     * @param {string} sortBy 'Created_Time' or 'Modified_Time'
     * @returns {Promise<Object|undefined>}
     */
    async latestRecord(context, sortBy) {

        const moduleName = lib.assertModule(context, context.properties.module);
        const [latest] = await lib.getLatestRecords(context, moduleName, { sortBy, max: 1 });
        return latest;
    }
};
