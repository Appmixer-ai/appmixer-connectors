'use strict';

module.exports = {

    async receive(context) {

        // https://developer.bigcommerce.com/docs/rest-catalog/category-trees/categories#get-all-categories
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/catalog/trees/categories`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            }
        });

        // BigCommerce API returns categories array in data.data
        const categories = Array.isArray(data.data) ? data.data : [];

        await context.sendJson({ categories }, 'out');
    },

    categoryToSelectArray({ categories }) {
        return categories.map(category => {
            return { label: category.name, value: category.category_id };
        });
    }
};
