'use strict';

const lib = require('../../lib');

// The output contract of one rate plan. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../../schema-rate-plan.json');

const fetchRatePlans = async (context, input) => {

    const records = await lib.fetchList(context, {
        segments: [...lib.hotelSegments(context, input), 'ratePlans'],
        label: 'the list of rate plans'
    });
    return records.map(lib.withLocalizedName);
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { publisherCode, hotelCode, outputType } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Rate Plans' });
        }

        // Source call: this component backs the rate plan dropdown of the other components. Without a
        // publisher and a hotel there is nothing to list yet.
        if (context.properties.isSource) {
            if (lib.isEmpty(publisherCode) || lib.isEmpty(hotelCode)) {
                return context.sendJson({ result: [] }, 'out');
            }
            return lib.sendSource(context, {
                source: 'rate-plans',
                publisherCode: String(publisherCode).trim(),
                hotelCode: String(hotelCode).trim()
            }, () => fetchRatePlans(context, { publisherCode, hotelCode }));
        }

        if (lib.isEmpty(publisherCode)) {
            throw new context.CancelError('Publisher is required!');
        }
        if (lib.isEmpty(hotelCode)) {
            throw new context.CancelError('Hotel is required!');
        }

        const records = await fetchRatePlans(context, { publisherCode, hotelCode });

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    },

    toSelectArray({ result }) {

        return (result || [])
            .filter(item => item && item.code)
            .map(item => ({
                label: item.name ? `${item.name} (${item.code})` : String(item.code),
                value: String(item.code)
            }));
    }
};
