'use strict';

module.exports = {

    async receive(context) {
        const {
            project_id: projectId,
            name,
            is_active: isActive,
            bill_by: billBy,
            hourly_rate: hourlyRate,
            budget,
            budget_is_monthly: budgetIsMonthly,
            notes
        } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        const data = {};

        if (name) {
            data.name = name;
        }

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

        if (notes !== undefined) {
            data.notes = notes;
        }

        // https://help.getharvest.com/api-v2/projects-api/projects/projects/#update-a-project
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.harvestapp.com/v2/projects/${projectId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (auth@appmixer.ai)',
                'Harvest-Account-ID': context.auth.accountId,
                'Content-Type': 'application/json'
            },
            data
        });

        return context.sendJson({}, 'out');
    }
};
