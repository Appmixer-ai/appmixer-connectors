'use strict';
const commons = require('../lib');

/**
 * Get all contacts, optionally scoped to a single account, together with their
 * related contact information (name, email, phone, ...).
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { accountId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return commons.getContactOutputPortOptions(context, outputType);
        }

        const where = accountId ? `AccountId = '${commons.escapeSoql(accountId)}'` : null;
        const records = await commons.findContacts(context, { where });

        if (!records.length) {
            return context.sendJson({}, 'notFound');
        }

        return commons.sendArrayOutput({
            context,
            outputPortName: 'out',
            outputType,
            records
        });
    }
};
