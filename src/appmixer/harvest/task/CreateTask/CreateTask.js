'use strict';

module.exports = {

    async receive(context) {

        const {
            name,
            isActive,
            billableByDefault,
            defaultHourlyRate,
            isDefault
        } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Task Name is required!');
        }

        const data = {
            name
        };

        if (typeof isActive === 'boolean') {
            data.is_active = isActive;
        }

        if (typeof billableByDefault === 'boolean') {
            data.billable_by_default = billableByDefault;
        }

        if (defaultHourlyRate !== undefined && defaultHourlyRate !== null) {
            data.default_hourly_rate = defaultHourlyRate;
        }

        if (typeof isDefault === 'boolean') {
            data.is_default = isDefault;
        }

        // https://help.getharvest.com/api-v2/tasks-api/tasks/tasks/#create-a-task
        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.harvestapp.com/v2/tasks',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId,
                'Content-Type': 'application/json'
            },
            data
        });

        return context.sendJson(responseData, 'out');
    }
};
