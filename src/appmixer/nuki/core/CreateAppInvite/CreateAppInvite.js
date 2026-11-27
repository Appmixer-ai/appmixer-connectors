'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        // The lookup of an authorization created earlier, scheduled by lib.createAuthorization.
        if (context.messages.timeout) {
            return lib.continueAuthorizationLookup(context);
        }

        const input = context.messages.in.content;
        const { smartlockId, accountUserId, name, remoteAllowed } = input;

        if (!smartlockId) {
            throw new context.CancelError('Smartlock is required!');
        }
        if (!accountUserId) {
            throw new context.CancelError('Account User is required!');
        }
        if (!name || !String(name).trim()) {
            throw new context.CancelError('Name is required!');
        }

        const id = lib.requireNumericId(context, smartlockId, 'Smartlock');
        const body = {
            name: lib.requireAuthorizationName(context, name),
            type: lib.AUTH_TYPE_APP,
            accountUserId: Number(lib.requireNumericId(context, accountUserId, 'Account User')),
            remoteAllowed: remoteAllowed === true || remoteAllowed === 'true',
            ...lib.buildAccessWindow(context, input)
        };

        // An offline device cannot receive the authorization. Refused before anything is written.
        const smartlock = await lib.getSmartlock(context, id);
        lib.assertOnline(context, smartlock, id);

        return lib.createAuthorization(context, { smartlockId: id, body });
    }
};
