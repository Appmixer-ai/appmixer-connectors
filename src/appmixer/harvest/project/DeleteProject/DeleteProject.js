'use strict';

module.exports = {

    async receive(context) {
        const { projectId } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        // https://help.getharvest.com/api-v2/projects-api/projects/projects/#delete-a-project
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.harvestapp.com/v2/projects/${projectId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId
            }
        });

        return context.sendJson({}, 'out');
    }
};
