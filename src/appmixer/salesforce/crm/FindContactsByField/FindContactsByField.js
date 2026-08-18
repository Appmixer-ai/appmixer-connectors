'use strict';
const commons = require('../lib');

/**
 * Get all contacts related to a chosen Contact field value, for example every
 * contact whose Account, Lead Source or a custom field (such as a Campaign ID)
 * matches a given value.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { fieldName, fieldValue, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return commons.getContactOutputPortOptions(context, outputType);
        }

        if (!fieldName) {
            throw new context.CancelError('Field is required!');
        }
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            throw new context.CancelError('Field value is required!');
        }

        // Reject anything that is not a plain Salesforce API field name so the
        // value cannot be used to inject arbitrary SOQL.
        commons.assertSafeIdentifier(fieldName, 'field name');

        const where = `${fieldName} = '${commons.escapeSoql(fieldValue)}'`;
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
