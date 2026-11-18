'use strict';

const lib = require('../../lib');

const EVENT = { model: 'time_entry', action: 'updated' };

module.exports = {

    async start(context) {

        return lib.webhooks.start(context, {
            eventFilters: [{ entity: EVENT.model, action: EVENT.action }],
            label: 'Time Entry Updated'
        });
    },

    async stop(context) {

        return lib.webhooks.stop(context);
    },

    // Re-pings the subscription until Toggl has validated it.
    async tick(context) {

        return lib.webhooks.tick(context);
    },

    async receive(context) {

        return lib.webhooks.receive(context, EVENT);
    },

    // Flow Test Mode: the most recently changed of your time entries in the workspace stands in
    // for the event payload (the updated time entry). Read-only, no state writes.
    async test(context) {

        const workspaceId = await lib.resolveWorkspaceId(context, context.properties.workspaceId);
        const entries = (await lib.listMyTimeEntries(context))
            .filter(entry => String(entry.workspace_id) === workspaceId)
            .sort(lib.byDateDesc('at'));

        if (entries.length === 0) {
            throw new context.CancelError('No time entries in this workspace yet. Track time in Toggl Track and test again.');
        }

        return context.sendJson(entries[0], 'out');
    }
};
