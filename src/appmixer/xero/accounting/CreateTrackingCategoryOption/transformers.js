'use strict';

/**
 * @param {Object|string} trackingCategories
 */
module.exports.categoriesToSelectArray = trackingCategories => {

    let transformed = [];

    if (Array.isArray(trackingCategories?.items)) {
        trackingCategories.items.forEach(category => {

            transformed.push({
                label: category['Name'],
                value: category['TrackingCategoryID']
            });
        });
    }

    return transformed;
};
