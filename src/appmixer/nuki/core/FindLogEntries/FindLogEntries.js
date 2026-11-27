'use strict';

const lib = require('../../lib');

// The output contract of one log entry. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../../schema-log-entry.json');

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            smartlockId, fromDate, toDate, action, authorizationId, accountUserId, outputType
        } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Log Entries' });
        }

        const id = isBlank(smartlockId) ? undefined : lib.requireNumericId(context, smartlockId, 'Smartlock');
        const authId = isBlank(authorizationId)
            ? undefined
            : lib.requireHexId(context, authorizationId, 'Authorization ID');

        // Only the log of one device can be filtered by authorization (GET /smartlock/log has no
        // such filter). Without this check the filter would be ignored and unrelated entries returned.
        if (authId && !id) {
            throw new context.CancelError('Smartlock is required when Authorization ID is set.');
        }

        const from = lib.toApiDate(context, fromDate, 'From Date');
        const to = lib.toApiDate(context, toDate, 'To Date');
        if (from && to && from > to) {
            throw new context.CancelError('To Date must not be earlier than From Date.');
        }

        const records = await lib.fetchLogEntries(context, {
            smartlockId: id,
            params: {
                fromDate: from,
                toDate: to,
                action: lib.optionalInteger(context, action, 'Action'),
                authId,
                accountUserId: lib.optionalInteger(context, accountUserId, 'Account User ID')
            }
        });

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
