'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, email, language } = context.messages.in.content;

        if (!name || !String(name).trim()) {
            throw new context.CancelError('Name is required!');
        }
        if (!email || !String(email).trim()) {
            throw new context.CancelError('Email is required!');
        }

        const user = await lib.request(context, {
            method: 'PUT',
            path: '/account/user',
            data: lib.clean({ name: String(name).trim(), email: String(email).trim(), language })
        });

        // The ID is what every later step needs. An answer without it must not look like a success.
        if (!user || typeof user !== 'object' || user.accountUserId === undefined || user.accountUserId === null) {
            throw new context.CancelError('Nuki accepted the request but returned no account user.');
        }

        return context.sendJson(user, 'out');
    }
};
