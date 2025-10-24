'use strict';

module.exports = {

    async receive(context) {

        const {
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

        if (!clientId) {
            throw new context.CancelError('Client ID is required!');
        }

        if (!name) {
            throw new context.CancelError('Project name is required!');
        }

        if (isBillable === undefined || isBillable === null) {
            throw new context.CancelError('Is Billable field is required!');
        }

        if (!billBy) {
            throw new context.CancelError('Bill By field is required!');
        }

        if (!budgetBy) {
            throw new context.CancelError('Budget By field is required!');
        }

        const body = {
            client_id: clientId,
            name,
            is_billable: isBillable,
            bill_by: billBy,
            budget_by: budgetBy
        };

        if (typeof isActive === 'boolean') {
            body.is_active = isActive;
        }

        if (typeof isFixedFee === 'boolean') {
            body.is_fixed_fee = isFixedFee;
        }

        if (hourlyRate !== undefined && hourlyRate !== null) {
            body.hourly_rate = hourlyRate;
        }

        if (budget !== undefined && budget !== null) {
            body.budget = budget;
        }

        if (typeof budgetIsMonthly === 'boolean') {
            body.budget_is_monthly = budgetIsMonthly;
        }

        if (code) {
            body.code = code;
        }

        if (notes) {
            body.notes = notes;
        }

        // https://help.getharvest.com/api-v2/projects-api/projects/projects/#create-a-project
        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.harvestapp.com/v2/projects',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Harvest-Account-ID': context.auth.profileInfo.accountId,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson(responseData, 'out');
    }
};
