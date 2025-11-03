'use strict';

module.exports = {

    async receive(context) {
        const { timeEntryId } = context.messages.in.content;

        if (!timeEntryId) {
            throw new context.CancelError('Time Entry ID is required!');
        }

        // https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/#retrieve-a-time-entry
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.harvestapp.com/v2/time_entries/${timeEntryId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId
            }
        });

        return context.sendJson(data, 'out');
    }
};
