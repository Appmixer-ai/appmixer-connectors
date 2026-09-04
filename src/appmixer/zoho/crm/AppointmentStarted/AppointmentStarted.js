'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

// The Appointments module is only exposed from API v5 up, hence the version override.
const makeClient = (context) => new ZohoClient(context, undefined, { apiVersion: lib.APPOINTMENTS_API_VERSION });

/**
 * Polls the Appointments module and emits every appointment whose start time has passed since the
 * previous tick. The first tick only records the watermark so that past appointments are not
 * replayed into the flow.
 */
module.exports = {

    async tick(context) {

        const now = lib.formatDateTime(new Date());
        const lastCheck = await context.stateGet('lastCheck');

        if (!lastCheck) {
            return context.stateSet('lastCheck', now);
        }

        const criteria = lib.buildCriteria([
            `(Appointment_Start_Time:greater_than:${lastCheck})`,
            `(Appointment_Start_Time:less_equal:${now})`
        ]);
        const records = await makeClient(context).search(lib.APPOINTMENTS_MODULE, {
            criteria,
            fields: lib.APPOINTMENT_FIELDS.join(',')
        });

        for (const record of records) {
            await context.sendJson(record, 'out');
        }

        return context.stateSet('lastCheck', now);
    },

    async test(context) {

        const record = await makeClient(context).getLatestRecord(lib.APPOINTMENTS_MODULE, {
            sortBy: 'Created_Time',
            fields: lib.APPOINTMENT_FIELDS.join(',')
        });

        if (!record) {
            throw new context.CancelError('No appointments found to use as test data.');
        }

        return context.sendJson(record, 'out');
    }
};
