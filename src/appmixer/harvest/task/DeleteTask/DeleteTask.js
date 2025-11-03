'use strict';

module.exports = {

    async receive(context) {

        const { taskId } = context.messages.in.content;

        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }

        // https://help.getharvest.com/api-v2/tasks-api/tasks/tasks/#delete-a-task
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.harvestapp.com/v2/tasks/${taskId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId
            }
        });

        return context.sendJson({}, 'out');
    }
};
