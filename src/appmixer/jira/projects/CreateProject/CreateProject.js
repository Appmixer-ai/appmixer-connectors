'use strict';
const commons = require('../../jira-commons');

module.exports = {
    async receive(context) {

        const { profileInfo: { apiUrl }, auth } = context;
        const { projectType } = context.properties;

        const project = context.messages.in.content;
        project.projectTypeKey = projectType;

        // https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-projects/#api-rest-api-3-project-post
        const result = await commons.post(`${apiUrl}project`, auth, project);
        return context.sendJson(result, 'project');
    }
};
