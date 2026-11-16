'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['start', 'date'],
    properties: {
        start: { type: 'string', format: 'date-time', title: 'Start', example: '2026-12-01T09:00:00.000+01:00' },
        end: { type: 'string', format: 'date-time', title: 'End', example: '2026-12-01T09:30:00.000+01:00' },
        date: { type: 'string', title: 'Date', example: '2026-12-01' }
    }
};

/**
 * GET /v2/slots answers with slots grouped by day: { "2026-12-01": [{ start, end }] }.
 * Flatten them into one list in time order.
 * @param {object} days
 * @returns {object[]}
 */
const flattenSlots = (days) => {

    const slots = [];
    for (const date of Object.keys(days || {}).sort()) {
        for (const slot of days[date] || []) {
            slots.push(typeof slot === 'string' ? { start: slot, date } : { ...slot, date });
        }
    }
    return slots;
};

module.exports = {

    ITEM_SCHEMA,

    flattenSlots,

    async receive(context) {

        const { eventTypeId, start, end, timeZone, duration, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Slots', value: 'result' });
        }

        if (!eventTypeId) {
            throw new context.CancelError('Event Type is required!');
        }
        if (!start) {
            throw new context.CancelError('From is required!');
        }
        if (!end) {
            throw new context.CancelError('To is required!');
        }

        const params = {
            eventTypeId: lib.toInteger(context, eventTypeId, 'Event Type'),
            start: lib.toIsoDate(context, start, 'From'),
            end: lib.toIsoDate(context, end, 'To'),
            format: 'range'
        };
        if (timeZone) {
            params.timeZone = timeZone;
        }
        const length = lib.toInteger(context, duration, 'Duration (Minutes)');
        if (length) {
            params.duration = length;
        }

        const body = await lib.request(context, {
            path: '/v2/slots',
            version: lib.API_VERSIONS.slots,
            params
        });

        const slots = flattenSlots(body.data);

        if (slots.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: slots });
    }
};
