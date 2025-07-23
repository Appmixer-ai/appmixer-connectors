'use strict';

/**
 * Transformer for stores to options
 * @param {Object|string} stores
 */
module.exports.storesToOptions = stores => {

    let transformed = [];

    if (Array.isArray(stores)) {
        stores.forEach(store => {
            transformed.push({
                label: store.attributes.name,
                value: store.id
            });
        });
    }

    return {
        inputs: {
            storeId: {
                type: 'select',
                label: 'Store',
                index: 0,
                tooltip: 'Select the store to create the customer in.',
                options: transformed
            }
        }
    };
};
