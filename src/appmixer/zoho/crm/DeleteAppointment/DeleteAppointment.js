'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

// Zoho CRM deletes at most 100 records in one request.
const MAX_IDS = 100;

/**
 * Delete one or more appointments (Appointments__s, Services module). The IDs go to
 * DELETE /crm/v8/Appointments__s?ids=<id>,<id>. Zoho answers per record; a record it could not
 * delete is reported in the response body, also when the HTTP status is 200.
 */
module.exports = {

    async receive(context) {

        const { appointmentId } = context.messages.in.content;

        const ids = [...new Set(String(appointmentId ?? '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean))];

        if (!ids.length) {
            throw new context.CancelError('Appointment ID is required!');
        }
        if (ids.length > MAX_IDS) {
            throw new context.CancelError(`Zoho CRM deletes at most ${MAX_IDS} appointments at once, got ${ids.length}.`);
        }

        // The Appointments module is only exposed from API v5 up, hence the version override.
        const client = new ZohoClient(context, undefined, { apiVersion: lib.APPOINTMENTS_API_VERSION });

        let response;
        try {
            response = await client.request('DELETE', client.path(`/${lib.APPOINTMENTS_MODULE}`), {
                params: { ids: ids.join(',') }
            });
        } catch (err) {
            // When no record could be deleted Zoho answers 4xx with the same per-record body.
            if (!Array.isArray(err?.data)) {
                throw err;
            }
            response = err;
        }

        const results = Array.isArray(response?.data) ? response.data : [];
        const failed = results
            .map((result, index) => ({ result, id: result?.details?.id || ids[index] }))
            .filter(({ result }) => result?.status !== 'success');

        if (failed.length) {
            const reasons = failed
                .map(({ result, id }) => `${id}: ${[result?.code, result?.message].filter(Boolean).join(' ') || 'unknown error'}`)
                .join('; ');
            throw new context.CancelError(
                `Zoho CRM did not delete ${failed.length} of ${ids.length} appointment(s): ${reasons}`
            );
        }

        await context.sendJson({}, 'out');
    }
};
