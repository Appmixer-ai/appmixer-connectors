'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'title', 'slug', 'lengthInMinutes', 'hidden', 'ownerId'],
    properties: {
        id: { type: 'integer', title: 'Event Type ID', example: 1234567 },
        title: { type: 'string', title: 'Title', example: '30 Min Meeting' },
        slug: { type: 'string', title: 'Slug', example: '30min' },
        description: { type: 'string', title: 'Description', example: 'A short call to get to know each other.' },
        lengthInMinutes: { type: 'integer', title: 'Length (Minutes)', example: 30 },
        hidden: { type: 'boolean', title: 'Hidden', example: false },
        minimumBookingNotice: { type: 'integer', title: 'Minimum Booking Notice (Minutes)', example: 120 },
        slotInterval: { type: 'integer', title: 'Slot Interval (Minutes)', example: 30 },
        beforeEventBuffer: { type: 'integer', title: 'Before Event Buffer (Minutes)', example: 0 },
        afterEventBuffer: { type: 'integer', title: 'After Event Buffer (Minutes)', example: 0 },
        scheduleId: { type: 'integer', title: 'Schedule ID', example: 98765 },
        price: { type: 'number', title: 'Price', example: 0 },
        currency: { type: 'string', title: 'Currency', example: 'usd' },
        ownerId: { type: 'integer', title: 'Owner ID', example: 112233 },
        bookingUrl: { type: 'string', title: 'Booking URL', example: 'https://cal.com/jane/30min' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Event Types', value: 'result' });
        }

        let eventTypes;
        try {
            eventTypes = isSource
                ? await lib.callCached(context, { op: 'eventTypes' }, () => lib.listEventTypes(context))
                : await lib.listEventTypes(context);
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records: eventTypes });
    },

    toSelectArray({ result }) {

        return (result || []).map(eventType => ({
            label: eventType.title + ' (' + eventType.lengthInMinutes + ' min, ' + eventType.slug + ')',
            value: String(eventType.id)
        }));
    }
};
