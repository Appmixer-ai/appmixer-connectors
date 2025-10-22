'use strict';

module.exports = {

    async receive(context) {

        const {
            clientId,
            name,
            isActive,
            billBy,
            hourlyRate,
            budget,
            budgetIsMonthly,
            notes
        } = context.messages.in.content;

        if (!clientId) {
            throw new context.CancelError('Client ID is required!');
        }

        if (!name) {
            throw new context.CancelError('Project name is required!');
        }

        const data = {
            client_id: clientId,
            name
        };

        if (typeof isActive === 'boolean') {
            data.is_active = isActive;
        }

        if (billBy) {
            data.bill_by = billBy;
        }

        if (hourlyRate !== undefined && hourlyRate !== null) {
            data.hourly_rate = hourlyRate;
        }

        if (budget !== undefined && budget !== null) {
            data.budget = budget;
        }

        if (typeof budgetIsMonthly === 'boolean') {
            data.budget_is_monthly = budgetIsMonthly;
        }

        if (notes) {
            data.notes = notes;
        }

        // https://help.getharvest.com/api-v2/projects-api/projects/projects/#create-a-project
        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.harvestapp.com/v2/projects',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.com)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId,
                'Content-Type': 'application/json'
            },
            data
        });

        return context.sendJson(responseData, 'out');
    }
};
