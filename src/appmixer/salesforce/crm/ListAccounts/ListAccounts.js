'use strict';
const commons = require('../lib');

/**
 * Component for fetching list of accounts
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        // Dynamic-input source calls (account dropdowns) are cached so repeated
        // inspector openings do not burn the salesforce request quota.
        const cache = context.properties.variableFetch || false;
        if (!cache) {
            const accounts = await this.listAccounts(context);
            return context.sendJson(accounts, 'accounts');
        }

        const cacheTTL = context.config.listAccountsCacheTTL || (5 * 60 * 1000);
        const cacheKey = 'salesforce_accounts_' + context.auth.userId + context.auth.profileInfo.email;
        let lock;
        try {
            lock = await context.lock(cacheKey);
            const cached = await context.staticCache.get(cacheKey);
            if (cached) {
                return context.sendJson(cached, 'accounts');
            }
            const accounts = await this.listAccounts(context);
            await context.staticCache.set(cacheKey, accounts, cacheTTL);
            return context.sendJson(accounts, 'accounts');
        } finally {
            lock?.unlock();
        }
    },

    listAccounts(context) {

        const client = commons.getSalesforceAPI(context);
        return client.sobject('Account').find();
    }
};
