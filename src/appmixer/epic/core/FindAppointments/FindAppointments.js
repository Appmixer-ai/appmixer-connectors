'use strict';

const lib = require('../../lib');
const { fhirRequest, extractResources, normalizeAppointment } = require('../../lib');

// Same flattened shape as Get Appointment, so both offer the same variables.
const ITEM_SCHEMA = {
    'type': 'object',
    'properties': {
        'id': {
            'type': 'string',
            'title': 'Appointment ID',
            'example': 'eAppointment123'
        },
        'status': {
            'type': 'string',
            'title': 'Status',
            'example': 'booked'
        },
        'start': {
            'type': 'string',
            'title': 'Start',
            'example': '2026-08-01T14:00:00Z'
        },
        'end': {
            'type': 'string',
            'title': 'End',
            'example': '2026-08-01T14:30:00Z'
        },
        'minutesDuration': {
            'type': 'number',
            'title': 'Duration (minutes)',
            'example': 30
        },
        'created': {
            'type': 'string',
            'title': 'Created',
            'example': '2026-07-01T09:12:00Z'
        },
        'description': {
            'type': 'string',
            'title': 'Description',
            'example': 'Office Visit'
        },
        'comment': {
            'type': 'string',
            'title': 'Comment',
            'example': 'Follow-up visit'
        },
        'serviceType': {
            'type': 'string',
            'title': 'Service Type',
            'example': 'Office Visit'
        },
        'appointmentType': {
            'type': 'string',
            'title': 'Appointment Type',
            'example': 'Routine'
        },
        'reason': {
            'type': 'string',
            'title': 'Reason',
            'example': 'Hypertension'
        },
        'patient': {
            'type': 'string',
            'title': 'Patient',
            'example': 'Camila Maria Lopez'
        },
        'patientReference': {
            'type': 'string',
            'title': 'Patient Reference',
            'example': 'Patient/erXuFYUfucBZaryVksYEcMg3'
        },
        'practitioners': {
            'type': 'array',
            'title': 'Practitioners',
            'items': {
                'type': 'string',
                'example': 'Physician Family Medicine, MD'
            },
            'example': [
                'Physician Family Medicine, MD'
            ]
        },
        'locations': {
            'type': 'array',
            'title': 'Locations',
            'items': {
                'type': 'string',
                'example': 'EMC Family Medicine'
            },
            'example': [
                'EMC Family Medicine'
            ]
        },
        'participants': {
            'type': 'array',
            'title': 'Participants',
            'items': {
                'type': 'object',
                'properties': {
                    'reference': {
                        'type': 'string',
                        'title': 'Participants.Reference',
                        'example': 'Practitioner/eM5CWtq15N0WJeuCet5bJlQ3'
                    },
                    'display': {
                        'type': 'string',
                        'title': 'Participants.Display',
                        'example': 'Physician Family Medicine, MD'
                    },
                    'status': {
                        'type': 'string',
                        'title': 'Participants.Status',
                        'example': 'accepted'
                    }
                }
            },
            'example': [
                {
                    'reference': 'Practitioner/eM5CWtq15N0WJeuCet5bJlQ3',
                    'display': 'Physician Family Medicine, MD',
                    'status': 'accepted'
                }
            ]
        },
        'lastUpdated': {
            'type': 'string',
            'title': 'Last Updated',
            'example': '2026-07-10T08:00:00Z'
        },
        'resource': {
            'type': 'object',
            'title': 'Raw FHIR Resource',
            'example': {
                'resourceType': 'Appointment',
                'id': 'eAppointment123',
                'status': 'booked'
            }
        }
    }
};

// The date-time inspector may hand over a full ISO timestamp; the FHIR `date`
// search parameter is matched on the calendar day.
function toFhirDate(value) {

    const text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
        return text.slice(0, 10);
    }
    const date = new Date(text);
    if (isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString().slice(0, 10);
}

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { patient, status, dateFrom, dateTo, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Appointments' });
        }

        if (!patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        // A date range repeats the `date` parameter (date=ge…&date=le…), so the
        // query string is built here rather than left to the HTTP client.
        const query = new URLSearchParams({ patient });
        if (status) {
            query.append('status', status);
        }
        const bounds = [['ge', dateFrom, 'Date From'], ['le', dateTo, 'Date To']];
        for (const [prefix, value, label] of bounds) {
            if (!value) continue;
            const day = toFhirDate(value);
            if (!day) {
                throw new context.CancelError(`${label} is not a valid date: ${value}`);
            }
            query.append('date', prefix + day);
        }

        const bundle = await fhirRequest(context, { resource: `Appointment?${query.toString()}` });
        const records = extractResources(bundle).map(normalizeAppointment);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
