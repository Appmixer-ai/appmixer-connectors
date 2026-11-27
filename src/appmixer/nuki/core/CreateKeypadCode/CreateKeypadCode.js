'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        // The lookup of an authorization created earlier, scheduled by lib.createAuthorization.
        if (context.messages.timeout) {
            return lib.continueAuthorizationLookup(context);
        }

        const input = context.messages.in.content;
        const { smartlockId, name, code } = input;

        if (!smartlockId) {
            throw new context.CancelError('Smartlock is required!');
        }
        if (!name || !String(name).trim()) {
            throw new context.CancelError('Name is required!');
        }

        const id = lib.requireNumericId(context, smartlockId, 'Smartlock');
        const generateCode = code === undefined || code === null || String(code).trim() === '';

        const body = {
            name: lib.requireAuthorizationName(context, name),
            type: lib.AUTH_TYPE_KEYPAD_CODE,
            // A keypad code is typed at the door. Remote access does not apply to it.
            remoteAllowed: false,
            ...lib.buildAccessWindow(context, input)
        };
        if (!generateCode) {
            body.code = lib.requireKeypadCode(context, code);
        }

        // A code on a device with no keypad can never open the door, and an offline device cannot
        // receive the code. Both are refused before anything is written.
        const smartlock = await lib.getSmartlock(context, id);
        lib.assertOnline(context, smartlock, id);
        // Refused only when the device says so: a device that reports neither flag is let through.
        const config = (smartlock && smartlock.config) || {};
        const flags = [config.keypadPaired, config.keypad2Paired].filter(flag => typeof flag === 'boolean');
        if (flags.length && !flags.includes(true)) {
            throw new context.CancelError(
                `No Keypad is paired with the device ${id}, so a keypad code cannot be used on it.`);
        }

        return lib.createAuthorization(context, { smartlockId: id, body, generateCode });
    }
};
