'use strict';

const lib = require('../../lib');

// The output contract of ONE contact. Loops also returns the account's custom
// contact properties on each contact; those differ per account and are not listed here.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'email'],
    properties: {
        id: { type: 'string', title: 'Contact ID', example: 'clh3k9m2p4q6r8s0t2v4x6z8' },
        email: { type: 'string', title: 'Email', example: 'alex@company.com' },
        firstName: { type: ['string', 'null'], title: 'First Name', example: 'Alex' },
        lastName: { type: ['string', 'null'], title: 'Last Name', example: 'Rivera' },
        source: { type: 'string', title: 'Source', example: 'API' },
        subscribed: { type: 'boolean', title: 'Subscribed', example: true },
        userGroup: { type: 'string', title: 'User Group', example: 'customers' },
        userId: { type: ['string', 'null'], title: 'User ID', example: 'usr_7f8e9d0c1b2a' },
        mailingLists: { type: 'object', title: 'Mailing Lists', properties: {} },
        optInStatus: { type: ['string', 'null'], title: 'Opt-in Status', example: 'accepted' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://loops.so/docs/api-reference/find-contact
    async receive(context) {

        const { email, userId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, {
                label: 'Contacts',
                value: 'result'
            });
        }

        if (!email && !userId) {
            throw new context.CancelError('Email or User ID is required!');
        }
        if (email && userId) {
            throw new context.CancelError('Provide either Email or User ID, not both.');
        }

        const { data } = await lib.request(context, {
            path: '/v1/contacts/find',
            params: email ? { email } : { userId }
        });

        const contacts = Array.isArray(data) ? data : [];
        if (contacts.length === 0) {
            return context.sendJson(lib.compact({ email, userId }), 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: contacts });
    }
};
