'use strict';

/**
 * @param {Object|string} customerGroups
 */
module.exports.customerGroupsToSelectArray = (customerGroups) => {

    let transformed = [];

    if (Array.isArray(customerGroups)) {
        customerGroups.forEach((group) => {

            transformed.push({
                label: group.name,
                value: group.id
            });
        });
    }

    return transformed;
};
