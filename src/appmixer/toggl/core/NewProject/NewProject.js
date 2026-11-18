'use strict';

const lib = require('../../lib');
const { fetchProjects } = require('../ListProjects/ListProjects');

/**
 * Projects of the workspace, newest created first. One page: more than 100 projects created
 * between two checks are not expected.
 */
const fetchNewest = context => fetchProjects(context, { orderBy: '-created_at', maxPages: 1 });

module.exports = {

    // The Toggl API has no webhooks: the trigger polls.
    async tick(context) {

        return lib.pollByTimestamp(context, {
            fetch: () => fetchNewest(context),
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
