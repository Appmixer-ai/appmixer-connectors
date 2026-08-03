/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib');

// PrestaShop multilang fields are returned as an array of { id, value }. Take the first value.
function firstValue(field) {
    if (Array.isArray(field)) {
        return field.length ? field[0].value : '';
    }
    return field != null ? String(field) : '';
}

const schema = {
    id: { type: 'string', title: 'Return ID' },
    id_order: { type: 'string', title: 'Order ID' },
    id_customer: { type: 'string', title: 'Customer ID' },
    state: { type: 'string', title: 'State ID' },
    state_name: { type: 'string', title: 'State' },
    question: { type: 'string', title: 'Question' },
    date_add: { type: 'string', title: 'Created Date' },
    date_upd: { type: 'string', title: 'Updated Date' }
};

module.exports = {

    async receive(context) {

        const { orderId, customerId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Returns' });
        }

        const params = {
            display: 'full',
            sort: '[date_add_DESC]',
            limit: 100
        };
        if (orderId) {
            params['filter[id_order]'] = orderId;
        }
        if (customerId) {
            params['filter[id_customer]'] = customerId;
        }

        const data = await lib.psRequest(context, { path: '/order_returns', params });
        const returns = data.order_returns || [];

        if (returns.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        // Resolve the readable name of each return state to describe the return journey.
        const stateNames = {};
        try {
            const statesData = await lib.psRequest(context, {
                path: '/order_return_states',
                params: { display: 'full' }
            });
            for (const state of statesData.order_return_states || []) {
                stateNames[String(state.id)] = firstValue(state.name);
            }
        } catch (err) {
            await context.log({ step: 'Could not load order return states', error: err.message });
        }

        const records = returns.map(item => ({
            ...item,
            state_name: stateNames[String(item.state)] || ''
        }));

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
