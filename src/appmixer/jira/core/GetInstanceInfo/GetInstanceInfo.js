'use strict';

module.exports = {

    async receive(context) {

        const { profileInfo: { apiUrl } } = context;

        try {
            // https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-server-info/#api-rest-api-3-serverinfo-get
            const { data } = await context.httpRequest({
                method: 'GET',
                url: `${apiUrl}serverInfo`,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`
                }
            });

            return context.sendJson(data, 'out');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new context.CancelError('Jira instance information not found or not accessible.');
            }
            throw error;
        }
    }
};

