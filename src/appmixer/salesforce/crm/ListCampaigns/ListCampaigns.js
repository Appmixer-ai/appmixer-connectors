'use strict';
const commons = require('../lib');

/**
 * Component for fetching list of campaigns
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const isSource = !!(context.properties
            && (context.properties.isSource || context.properties.variableFetch));

        try {
            const campaigns = isSource
                ? await commons.listCampaignsCached(context)
                : await commons.listCampaigns(context);

            return context.sendJson(campaigns, 'campaigns');
        } catch (err) {
            if (isSource) {
                // Never break the inspector dropdown on API failures.
                return context.sendJson([], 'campaigns');
            }
            throw err;
        }
    }
};
