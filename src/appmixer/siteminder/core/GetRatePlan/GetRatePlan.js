'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { publisherCode, hotelCode, ratePlanCode } = context.messages.in.content;

        if (lib.isEmpty(publisherCode)) {
            throw new context.CancelError('Publisher is required!');
        }
        if (lib.isEmpty(hotelCode)) {
            throw new context.CancelError('Hotel is required!');
        }
        if (lib.isEmpty(ratePlanCode)) {
            throw new context.CancelError('Rate Plan is required!');
        }

        const item = await lib.fetchObject(context, {
            segments: [
                ...lib.hotelSegments(context, { publisherCode, hotelCode }),
                'ratePlans', lib.pathSegment(context, ratePlanCode, 'Rate Plan')
            ],
            label: 'the rate plan'
        });

        return context.sendJson(lib.withLocalizedName(item), 'out');
    }
};
