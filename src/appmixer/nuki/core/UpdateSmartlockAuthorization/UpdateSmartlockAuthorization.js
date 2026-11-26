'use strict';

const lib = require('../../lib');

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const toBoolean = (value) => {

    if (isBlank(value)) {
        return undefined;
    }
    return value === true || value === 'true';
};

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const { smartlockId, authorizationId, name, enabled, remoteAllowed, code } = input;

        if (!smartlockId) {
            throw new context.CancelError('Smartlock is required!');
        }
        if (!authorizationId) {
            throw new context.CancelError('Authorization ID is required!');
        }

        const id = lib.requireNumericId(context, smartlockId, 'Smartlock');
        const authId = lib.requireHexId(context, authorizationId, 'Authorization ID');

        const changes = {
            ...lib.buildAccessWindow(context, input)
        };
        if (!isBlank(name)) {
            changes.name = lib.requireAuthorizationName(context, name);
        }
        if (toBoolean(enabled) !== undefined) {
            changes.enabled = toBoolean(enabled);
        }
        if (toBoolean(remoteAllowed) !== undefined) {
            changes.remoteAllowed = toBoolean(remoteAllowed);
        }
        if (!isBlank(code)) {
            changes.code = lib.requireKeypadCode(context, code);
        }

        if (!Object.keys(changes).length) {
            throw new context.CancelError('Nothing to update: set at least one field to change.');
        }

        // The API requires the name on every update, and its reference does not say whether a field
        // left out keeps its value. The current values are therefore read and sent back together
        // with the changes, which is right either way. The keypad code is sent only when it changes.
        const current = await lib.getAuthorization(context, id, authId);
        if (!current || typeof current !== 'object' || !current.name) {
            throw new context.CancelError(`Authorization ${authId} was not found on device ${id}.`);
        }

        const body = { name: current.name };
        const kept = ['enabled', 'remoteAllowed', 'allowedFromDate', 'allowedUntilDate', 'allowedWeekDays',
            'allowedFromTime', 'allowedUntilTime'];
        for (const field of kept) {
            if (current[field] !== undefined && current[field] !== null) {
                body[field] = current[field];
            }
        }
        Object.assign(body, changes);

        if (body.allowedFromDate && body.allowedUntilDate
            && new Date(body.allowedFromDate) >= new Date(body.allowedUntilDate)) {
            throw new context.CancelError('Allowed Until must be later than Allowed From.');
        }

        await lib.request(context, { method: 'POST', path: `/smartlock/${id}/auth/${authId}`, data: body });

        return context.sendJson({}, 'out');
    }
};
