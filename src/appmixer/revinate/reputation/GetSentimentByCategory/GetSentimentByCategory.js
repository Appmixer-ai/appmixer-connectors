'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { hotelId, startDate, endDate } = context.messages.in.content;

        if (!hotelId) {
            throw new context.CancelError('Hotel is required!');
        }

        const id = lib.requireNumericId(context, hotelId, 'Hotel');
        const snapshot = await lib.fetchObject(context, {
            label: 'the sentiment by category',
            path: `/hotels/${id}/topiccategoriessnapshot`,
            params: { date: lib.toDateRange(context, startDate, endDate, 'Date') }
        });

        return context.sendJson(snapshot, 'out');
    }
};
