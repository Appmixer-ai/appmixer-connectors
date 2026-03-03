'use strict';

const lib = require('../../lib');

const outputPortItemSchema = {
    id: { type: 'integer', title: 'ID' },
    title: { type: 'string', title: 'Title' },
    description: { type: ['string', 'null'], title: 'Description' },
    from_date: { type: 'string', title: 'From Date' },
    end_date: { type: 'string', title: 'End Date' },
    time_zone: { type: 'string', title: 'Time Zone' },
    location: { type: ['string', 'null'], title: 'Location' },
    is_allday: { type: 'boolean', title: 'Is All Day' },
    outcome_id: { type: ['integer', 'null'], title: 'Outcome ID' },
    provider: { type: 'string', title: 'Provider' },
    creater_id: { type: 'integer', title: 'Creator ID' },
    created_at: { type: 'string', title: 'Created At' },
    updated_at: { type: 'string', title: 'Updated At' },
    latitude: { type: ['string', 'null'], title: 'Latitude' },
    longitude: { type: ['string', 'null'], title: 'Longitude' },
    checkedin_at: { type: ['string', 'null'], title: 'Checked In At' },
    checkedout_at: { type: ['string', 'null'], title: 'Checked Out At' },
    checkedin_duration: { type: ['number', 'null'], title: 'Checked In Duration' },
    checkedout_latitude: { type: ['string', 'null'], title: 'Checked Out Latitude' },
    checkedout_longitude: { type: ['string', 'null'], title: 'Checked Out Longitude' },
    checkedout_location: { type: ['string', 'null'], title: 'Checked Out Location' },
    can_checkin: { type: 'boolean', title: 'Can Check In' },
    can_checkin_checkout: { type: 'boolean', title: 'Can Check In/Out' },
    conference_id: { type: ['integer', 'null'], title: 'Conference ID' },
    note_id: { type: ['integer', 'null'], title: 'Note ID' },
    has_multiple_emails: { type: 'boolean', title: 'Has Multiple Emails' },
    targetable: { type: ['object', 'null'], title: 'Targetable' },
    targetables: { type: 'array', title: 'Targetables' },
    targetables_with_email: { type: 'array', title: 'Targetables With Email' },
    appointment_attendee_ids: { type: 'array', title: 'Attendee IDs' }
};

module.exports = {

    async receive(context) {

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(
                context,
                context.messages.in.content.outputType,
                outputPortItemSchema,
                { label: 'Appointments' }
            );
        }

        const { filter, include, outputType } = context.messages.in.content;

        const params = new URLSearchParams();
        if (filter) params.set('filter', filter);
        if (include) params.set('include', include);

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${context.auth.domain}/api/appointments?${params}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const appointments = data?.appointments || data || [];

        if (appointments.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({
            context,
            outputPortName: 'out',
            outputType: outputType || 'array',
            records: appointments
        });
    }
};
