'use strict';

module.exports = {

    accountsToSelectArray(accounts) {

        if (!Array.isArray(accounts)) {
            return [];
        }

        return accounts.map(account => ({
            label: account.name || `Account ${account.id}`,
            value: account.id
        }));
    },

    async receive(context) {

        // https://developers.freshsales.io/api/#list_all_sales_accounts
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${context.auth.domain}/api/sales_accounts/filters/views`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // First get default view to list accounts
        const views = data.filters || [];
        const defaultView = views.find(v => v.is_default) || views[0];

        if (!defaultView) {
            return context.sendJson([], 'out');
        }

        // Use the default view to list accounts
        const accountsResponse = await context.httpRequest({
            method: 'GET',
            url: `https://${context.auth.domain}/api/sales_accounts/view/${defaultView.id}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const accounts = accountsResponse.data.sales_accounts || [];

        return context.sendJson(accounts, 'out');
    }
};
