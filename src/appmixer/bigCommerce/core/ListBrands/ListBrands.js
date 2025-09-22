'use strict';

module.exports = {

    async receive(context) {

        // https://developer.bigcommerce.com/docs/rest-catalog/brands#get-all-brands
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/catalog/brands`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            }
        });

        // BigCommerce API returns brands array in data.data
        const brands = Array.isArray(data.data) ? data.data : [];

        await context.sendJson({ brands }, 'out');
    },

    brandToSelectArray({ brands }) {
        return brands.map(brand => {
            return { label: brand.name, value: brand.id };
        });
    }
};
