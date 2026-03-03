'use strict';

const lib = require('../../lib');

const outputPortItemSchema = {
    id: { type: 'integer', title: 'Deal ID' },
    name: { type: 'string', title: 'Deal Name' },
    amount: { type: 'string', title: 'Amount' },
    currency_code: { type: 'string', title: 'Currency Code' },
    base_currency_amount: { type: 'string', title: 'Base Currency Amount' },
    expected_close: { type: ['string', 'null'], title: 'Expected Close' },
    closed_date: { type: ['string', 'null'], title: 'Closed Date' },
    deal_pipeline_id: { type: 'integer', title: 'Pipeline ID' },
    deal_stage_id: { type: 'integer', title: 'Stage ID' },
    probability: { type: 'integer', title: 'Probability' },
    age: { type: 'integer', title: 'Age (days)' },
    owner_id: { type: ['integer', 'null'], title: 'Owner ID' },
    creater_id: { type: 'integer', title: 'Creator ID' },
    expected_deal_value: { type: 'string', title: 'Expected Deal Value' },
    stage_updated_time: { type: 'string', title: 'Stage Updated Time' },
    created_at: { type: 'string', title: 'Created At' },
    updated_at: { type: 'string', title: 'Updated At' },
    tags: { type: 'array', title: 'Tags' },
    custom_field: { type: 'object', title: 'Custom Fields' },
    links: { type: 'object', title: 'Links' },
    recent_note: { type: ['string', 'null'], title: 'Recent Note' },
    is_deleted: { type: 'boolean', title: 'Is Deleted' },
    team_user_ids: { type: 'array', title: 'Team User IDs' },
    has_products: { type: 'boolean', title: 'Has Products' },
    products: { type: 'array', title: 'Products' },
    forecast_category: { type: ['integer', 'null'], title: 'Forecast Category' },
    deal_prediction: { type: 'integer', title: 'Deal Prediction' },
    record_type_id: { type: 'string', title: 'Record Type ID' },
    rotten_days: { type: ['integer', 'null'], title: 'Rotten Days' }
};

module.exports = {

    async receive(context) {

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(
                context,
                context.messages.in.content.outputType,
                outputPortItemSchema,
                { label: 'Deals', value: 'deals' }
            );
        }

        const { view_id: viewId, sort, sort_type: sortType, outputType } = context.messages.in.content;

        if (!viewId) {
            throw new context.CancelError('View is required!');
        }

        const params = {};
        if (sort) params.sort = sort;
        if (sortType) params.sort_type = sortType;

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${context.auth.domain}/api/deals/view/${viewId}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params
        });

        const deals = data?.deals || [];

        if (deals.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({
            context,
            outputPortName: 'out',
            outputType: outputType || 'array',
            records: deals
        });
    }
};
