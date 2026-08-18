'use strict';

/**
 * Transformer for campaigns in salesforce
 * @param {Object|string} campaigns
 */
module.exports.campaignsToSelectArray = campaigns => {

    let transformed = [];

    if (Array.isArray(campaigns)) {
        campaigns.forEach(campaign => {

            transformed.push({
                label: campaign['Name'],
                value: campaign['Id']
            });
        });
    }

    return transformed;
};
