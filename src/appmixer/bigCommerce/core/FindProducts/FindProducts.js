/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib.generated');
const schema = {
    id: { type: 'number', title: 'Product Id' },
    name: { type: 'string', title: 'Name' },
    type: { type: 'string', title: 'Type' },
    sku: { type: 'string', title: 'Sku' },
    description: { type: 'string', title: 'Description' },
    price: { type: 'number', title: 'Price' },
    cost_price: { type: 'number', title: 'Cost Price' },
    sale_price: { type: 'number', title: 'Sale Price' },
    calculated_price: { type: 'number', title: 'Calculated Price' },
    currency_code: { type: 'string', title: 'Currency Code' },
    brand_id: { type: 'number', title: 'Brand Id' },
    categories: {
        type: 'array',
        items: { type: 'number' },
        title: 'Categories'
    },
    inventory_level: { type: 'number', title: 'Inventory Level' },
    inventory_tracking: { type: 'string', title: 'Inventory Tracking' },
    is_visible: { type: 'boolean', title: 'Is Visible' },
    is_featured: { type: 'boolean', title: 'Is Featured' },
    images: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'number', title: 'Image Id' },
                image_url: { type: 'string', title: 'Image Url' },
                is_thumbnail: { type: 'boolean', title: 'Is Thumbnail' }
            }
        },
        title: 'Images'
    },
    primary_image: {
        type: 'object',
        properties: {
            id: { type: 'number', title: 'Primary Image.Id' },
            image_file: { type: 'string', title: 'Primary Image.Image File' }
        },
        title: 'Primary Image'
    },
    custom_url: {
        type: 'object',
        properties: {
            url: { type: 'string', title: 'Custom Url' },
            is_customized: { type: 'boolean', title: 'Is Customized' }
        },
        title: 'Custom Url'
    },
    date_created: { type: 'string', title: 'Date Created' },
    date_modified: { type: 'string', title: 'Date Modified' }
};


module.exports = {

    async receive(context) {

        const {
            keyword,
            sku,
            name,
            brand_id,
            categories,
            is_visible,
            is_featured,
            price,
            availability,
            type,
            date_modified_start,
            date_modified_end,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // Build query parameters
        const params = {
            limit: 250,  // Hardcode optimal limit
            include: 'bulk_pricing_rules,custom_fields'  // Hardcode useful includes
        };

        if (keyword) {
            params.keyword = keyword;
        }
        if (sku) {
            params.sku = sku;
        }
        if (name) {
            params.name = name;
        }
        if (brand_id) {
            params.brand_id = parseInt(brand_id, 10);
        }
        if (categories) {
            // Support both single category and comma-separated list
            params['categories:in'] = Array.isArray(categories) ? categories.join(',') : categories;
        }
        if (typeof is_visible === 'boolean') {
            params.is_visible = is_visible;
        }
        if (typeof is_featured === 'boolean') {
            params.is_featured = is_featured ? 1 : 0;
        }
        if (price) {
            params.price = parseFloat(price);
        }
        if (availability) {
            params.availability = availability;
        }
        if (type) {
            params.type = type;
        }
        if (date_modified_start) {
            params['date_modified:min'] = date_modified_start;
        }
        if (date_modified_end) {
            params['date_modified:max'] = date_modified_end;
        }

        // https://developer.bigcommerce.com/api-reference/store-management/catalog/products/getproducts
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/catalog/products`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            },
            params
        });

        const records = data.data || [];

        // Handle empty results with notFound port
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
