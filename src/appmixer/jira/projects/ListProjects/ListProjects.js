'use strict';
const commons = require('../../jira-commons');

/**
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { profileInfo: { apiUrl } } = context;

        const projects = await commons.pager({
            endpoint: `${apiUrl}project/search`,
            context,
            key: 'values',
            params: { maxResults: 100 }
        });

        return context.sendJson(projects, 'projects');
    },

    projectsToSelectArray(projects) {

        if (projects && Array.isArray(projects)) {
            return projects.map(project => ({
                label: `${project.name}`,
                value: project.id
            }));
        }
        return [];
    }
};
