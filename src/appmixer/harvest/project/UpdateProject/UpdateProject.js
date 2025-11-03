'use strict';

module.exports = {

    async receive(context) {
        const {
            projectId,
            clientId,
            name,
            isBillable,
            billBy,
            budgetBy,
            code,
            isFixedFee,
            hourlyRate,
            budget,
            budgetIsMonthly,
            notes,
            isActive
        } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        const data = {};

        if (clientId !== undefined && clientId !== null) {
            data.client_id = clientId;
        }

        if (name !== undefined && name !== null) {
            data.name = name;
        }

        if (typeof isBillable === 'boolean') {
            data.is_billable = isBillable;
        }

        if (billBy !== undefined && billBy !== null) {
            data.bill_by = billBy;
        }

        if (budgetBy !== undefined && budgetBy !== null) {
            data.budget_by = budgetBy;
        }

        if (code !== undefined && code !== null) {
            data.code = code;
        }

        if (typeof isFixedFee === 'boolean') {
            data.is_fixed_fee = isFixedFee;
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

        if (notes !== undefined && notes !== null) {
            data.notes = notes;
        }

        if (typeof isActive === 'boolean') {
            data.is_active = isActive;
        }

        // https://help.getharvest.com/api-v2/projects-api/projects/projects/#update-a-project
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.harvestapp.com/v2/projects/${projectId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId
            },
            data
        });

        return context.sendJson({}, 'out');
    }
};
