'use strict';

const lib = require('../../lib');

// The output contract of one account user. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../../schema-account-user.json');

// GET /account/user takes offset and limit. The API reference names no maximum for limit.
const PAGE_SIZE = 100;

const fetchUsers = async (context, email) => {

    const data = await lib.request(context, {
        path: '/account/user',
        params: lib.clean({ email, limit: PAGE_SIZE })
    });
    if (!Array.isArray(data)) {
        throw new Error('Nuki returned an unexpected answer for the list of account users.');
    }
    return data;
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { email, outputType } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Account Users' });
        }

        // Source call for the Account User dropdown: cached, and an error shows an empty dropdown
        // (the ID can still be typed) instead of an error popup.
        if (context.properties.isSource) {
            try {
                const result = await lib.callCached(context, { source: 'accountUsers' }, async () => {
                    const users = await fetchUsers(context);
                    return users.map(user => ({
                        accountUserId: user.accountUserId,
                        name: user.name,
                        email: user.email
                    }));
                });
                return context.sendJson({ result }, 'out');
            } catch (err) {
                return context.sendJson({ result: [] }, 'out');
            }
        }

        const records = await fetchUsers(context, typeof email === 'string' ? email.trim() : email);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    },

    toSelectArray({ result }) {

        return (result || []).map(user => ({
            label: [user.name, user.email].filter(Boolean).join(' - ') || String(user.accountUserId),
            value: String(user.accountUserId)
        }));
    }
};
