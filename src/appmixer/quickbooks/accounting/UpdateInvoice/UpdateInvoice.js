'use strict';
const { sparseUpdate } = require('../../commons');

const isSet = value => value !== undefined && value !== null && value !== '';

const buildChanges = (context, content) => {

    const changes = {};

    if (isSet(content.dueDate)) changes.DueDate = content.dueDate;
    if (isSet(content.txnDate)) changes.TxnDate = content.txnDate;
    if (isSet(content.docNumber)) changes.DocNumber = content.docNumber;
    if (isSet(content.billEmail)) changes.BillEmail = { Address: content.billEmail };
    if (isSet(content.customerMemo)) changes.CustomerMemo = { value: content.customerMemo };
    if (isSet(content.privateNote)) changes.PrivateNote = content.privateNote;

    if (isSet(content.lineItemsJSON)) {
        let lines;
        try {
            lines = typeof content.lineItemsJSON === 'string' ? JSON.parse(content.lineItemsJSON) : content.lineItemsJSON;
        } catch (e) {
            throw new context.CancelError('Invalid JSON in "Line Items JSON".');
        }
        if (!Array.isArray(lines) || lines.length === 0) {
            throw new context.CancelError('"Line Items JSON" must be a non-empty JSON array of invoice lines.');
        }
        changes.Line = lines;
    }

    return changes;
};

module.exports = {

    async receive(context) {

        const content = context.messages.in.content;
        const invoiceId = isSet(content.invoiceId) ? String(content.invoiceId) : '';

        if (!invoiceId) {
            throw new context.CancelError('Invoice ID is required!');
        }

        const changes = buildChanges(context, content);
        if (Object.keys(changes).length === 0) {
            throw new context.CancelError('Nothing to update. Fill in at least one field to change.');
        }

        await sparseUpdate(context, 'Invoice', invoiceId, () => changes);

        await context.sendJson({}, 'out');
    }
};
