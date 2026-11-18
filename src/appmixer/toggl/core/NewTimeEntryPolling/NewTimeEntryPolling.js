'use strict';

const lib = require('../../lib');

// GET /me/time_entries counts against the user-specific quota of 30 requests per hour
// (Free plan), so the trigger checks at most every 5 minutes.
const POLL_INTERVAL = 5 * 60 * 1000;
// New entries are looked for among the entries that start within this window.
const LOOKBACK = 24 * 60 * 60 * 1000;

/**
 * Your time entries that start in [now - 24 h, now + 24 h], filtered to the selected
 * workspace. Shared by tick() and test().
 */
const fetchEntries = async (context, params) => {

    const { workspaceId } = context.properties;
    const workspace = workspaceId ? lib.requireId(context, workspaceId, 'Workspace') : null;
    const entries = await lib.listMyTimeEntries(context, params);
    return workspace ? entries.filter(entry => String(entry.workspace_id) === workspace) : entries;
};

const windowParams = (context, now) => ({
    start_date: lib.toTogglTime(context, now - LOOKBACK, 'Start Date'),
    end_date: lib.toTogglTime(context, now + LOOKBACK, 'End Date')
});

module.exports = {

    async tick(context) {

        const now = Date.now();
        const state = context.state || {};
        if (state.lastPoll && now - state.lastPoll < POLL_INTERVAL) {
            return;
        }

        let lock;
        try {
            lock = await context.lock(context.componentId, { ttl: 2 * 60 * 1000, maxRetryCount: 0 });
        } catch (err) {
            // Another tick is still running.
            return;
        }

        try {
            const entries = await fetchEntries(context, windowParams(context, now));
            const known = Array.isArray(state.known) ? new Set(state.known.map(String)) : null;

            if (!known) {
                // First run: remember what exists, emit nothing.
                return await context.saveState({ known: entries.map(entry => entry.id), lastPoll: now });
            }

            if (known.size && entries.length === 0) {
                // An empty answer while entries are known: keep the known set, so the next
                // answer is not taken as all new.
                return await context.saveState({ known: state.known, lastPoll: now });
            }

            // The window only moves forward, so an entry that was not known before is new.
            const newEntries = entries
                .filter(entry => !known.has(String(entry.id)))
                .sort((a, b) => String(a.start).localeCompare(String(b.start)));

            for (const entry of newEntries) {
                await context.sendJson(entry, 'out');
            }

            await context.saveState({ known: entries.map(entry => entry.id), lastPoll: now });
        } finally {
            lock?.unlock();
        }
    },

    // Flow Test Mode: your newest time entry (in the selected workspace). Read-only.
    async test(context) {

        const entries = (await fetchEntries(context, {})).sort(lib.byDateDesc('start'));

        if (entries.length === 0) {
            throw new context.CancelError('No time entries found. Track time in Toggl Track and test again.');
        }

        return context.sendJson(entries[0], 'out');
    }
};
