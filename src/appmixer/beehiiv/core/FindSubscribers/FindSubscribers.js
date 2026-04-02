'use strict';

const api = require('../../api');
const lib = require('../../lib');

const SCHEMA = {
    id: { type: 'string', title: 'Subscriber ID' },
    email: { type: 'string', title: 'Email' },
    status: { type: 'string', title: 'Status' },
    subscription_tier: { type: 'string', title: 'Tier' },
    referral_code: { type: 'string', title: 'Referral Code' },
    created: { type: 'integer', title: 'Created' }
};

module.exports = {

    async receive(context) {

        const { publicationId, status, tier, limit, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Subscribers', value: 'result' });
        }

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }

        const params = { publicationId, limit };
        if (status && status !== 'all') params.status = status;
        if (tier && tier !== 'all') params.tier = tier;

        const result = await api.Index5.execute(context, params);
        const items = result.data || [];

        if (items.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
