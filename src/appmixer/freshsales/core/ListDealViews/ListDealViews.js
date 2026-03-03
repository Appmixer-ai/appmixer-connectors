'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'number', 'title': 'Deal View Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'filter_id': { 'type': ['number', 'null'], 'title': 'Filter Id' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'title': 'Updated At' },
    'is_default': { 'type': 'boolean', 'title': 'Is Default' },
    'is_system_view': { 'type': 'boolean', 'title': 'Is System View' },
    'user_id': { 'type': ['number', 'null'], 'title': 'User Id' },
    'access_level': { 'type': 'string', 'title': 'Access Level' },
    'model_class_name': { 'type': 'string', 'title': 'Model Class Name' },
    'user_name': { 'type': ['string', 'null'], 'title': 'User Name' },
    'current_user_permissions': { 'type': 'array', 'title': 'Current User Permissions', 'items': { 'type': 'string' } }
};

module.exports = {
    dealViewsToSelectArray({ result:views }) {


        // console.log(views)
        if (!Array.isArray(views)) {
            return [];
        }

        return views.map(view => ({
            label: view.name || view.id,
            value: view.id
        }));
    },

    async receive(context) {

        const { page = 1, per_page: perPage = 25, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Deal Views', value: 'deal_views' });
        }

        // https://developers.freshsales.io/api/#list_deal_views
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${context.auth.domain}/api/deals/filters`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params: {
                page,
                per_page: perPage
            }
        });

        const dealViews = data.deal_filters || data.deal_views || data.filters || [];

        if (dealViews.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: dealViews, outputType });
    }
};
