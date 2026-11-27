'use strict';

const lib = require('../../lib');

/**
 * The filters of the trigger, validated. Shared by tick() and test().
 * @param {object} context
 * @returns {{ smartlockId: (string|undefined), action: (number|undefined) }}
 */
const readFilters = (context) => {

    const { smartlockId, action } = context.properties || {};
    const hasSmartlock = smartlockId !== undefined && smartlockId !== null && String(smartlockId).trim() !== '';

    return {
        smartlockId: hasSmartlock ? lib.requireNumericId(context, smartlockId, 'Smartlock') : undefined,
        action: lib.optionalInteger(context, action, 'Action')
    };
};

module.exports = {

    // Webhooks need Nuki's Advanced API, which an API token does not have, so the log is polled.
    async tick(context) {

        const { emit, state } = await lib.pollLogEntries(context, readFilters(context));

        for (const entry of emit) {
            await context.sendJson(entry, 'out');
        }

        if (state) {
            await context.saveState(state);
        }
    },

    // Flow Test Mode: emit the most recent matching log entry. Read-only, no state writes.
    async test(context) {

        const { smartlockId, action } = readFilters(context);
        const entries = await lib.fetchLogEntries(context, { smartlockId, params: { action, limit: 1 } });

        if (!entries.length) {
            throw new context.CancelError('No log entry matches the trigger settings yet. Operate the device once '
                + '(for example lock it in the Nuki app) and try again.');
        }

        return context.sendJson(entries[0], 'out');
    }
};
