'use strict';

const lib = require('../../lib');
const { fetchProjects } = require('../ListProjects/ListProjects');

const EVENT = { model: 'project', action: 'created' };

module.exports = {

    async start(context) {

        return lib.webhooks.start(context, {
            eventFilters: [{ entity: EVENT.model, action: EVENT.action }],
            label: 'New Project'
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

    // Flow Test Mode: the newest project of the workspace stands in for the event payload (the
    // created project). Read-only, no state writes.
    async test(context) {

        const workspaceId = await lib.resolveWorkspaceId(context, context.properties.workspaceId);
        const projects = (await fetchProjects(context, workspaceId, false))
            .sort(lib.byDateDesc('created_at'));

        if (projects.length === 0) {
            throw new context.CancelError('No projects in this workspace yet. Create a project in Toggl Track and test again.');
        }

        return context.sendJson(projects[0], 'out');
    }
};
