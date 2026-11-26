'use strict';

const lib = require('../../lib');

/**
 * Projects of the workspace, newest created first: one page, or back to `since` when polling.
 */
const fetchNewest = (context, since) => lib.fetchProjects(context, {
    orderBy: '-created_at',
    ...lib.pagesSince('created_at', since)
});

module.exports = {

    // The Toggl API has no webhooks: the trigger polls.
    async tick(context) {

        return lib.pollByTimestamp(context, {
            fetch: since => fetchNewest(context, since),
            field: 'created_at'
        });
    },

    // Flow Test Mode: the most recently created project. Read-only.
    async test(context) {

        const projects = await fetchNewest(context);

        if (projects.length === 0) {
            throw new context.CancelError('No projects found. Create a project in Toggl and test again.');
        }

        return context.sendJson(projects[0], 'out');
    }
};
