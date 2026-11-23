'use strict';
const { sparseUpdate } = require('../../commons');

const isSet = value => value !== undefined && value !== null && value !== '';

const parseLines = (context, lineItemsJSON) => {

    let lines;
    try {
        lines = typeof lineItemsJSON === 'string' ? JSON.parse(lineItemsJSON) : lineItemsJSON;
    } catch (e) {
        throw new context.CancelError('Invalid JSON in "Line Items JSON".');
    }
    if (!Array.isArray(lines) || lines.length === 0) {
        throw new context.CancelError('"Line Items JSON" must be a non-empty JSON array of bill lines.');
    }
    return lines;
};

const buildChanges = (context, content) => {

    const changes = {};

    if (isSet(content.vendorId)) changes.VendorRef = { value: String(content.vendorId) };
    if (isSet(content.dueDate)) changes.DueDate = content.dueDate;
    if (isSet(content.txnDate)) changes.TxnDate = content.txnDate;
    if (isSet(content.docNumber)) changes.DocNumber = content.docNumber;
    if (isSet(content.privateNote)) changes.PrivateNote = content.privateNote;
    if (isSet(content.apAccountId)) changes.APAccountRef = { value: String(content.apAccountId) };
    if (isSet(content.salesTermId)) changes.SalesTermRef = { value: String(content.salesTermId) };
    if (isSet(content.departmentId)) changes.DepartmentRef = { value: String(content.departmentId) };
    if (isSet(content.lineItemsJSON)) changes.Line = parseLines(context, content.lineItemsJSON);

    return changes;
};

module.exports = {

    async receive(context) {

        const content = context.messages.in.content;
        const billId = isSet(content.billId) ? String(content.billId) : '';

        if (!billId) {
            throw new context.CancelError('Bill ID is required!');
        }

        const changes = buildChanges(context, content);
        if (Object.keys(changes).length === 0) {
            throw new context.CancelError('Nothing to update. Fill in at least one field to change.');
        }

        // QuickBooks requires VendorRef even in a sparse Bill update (error 2020),
        // so the current vendor is sent along unless a new one is given.
        await sparseUpdate(context, 'Bill', billId, current => ({ VendorRef: current.VendorRef, ...changes }));

        await context.sendJson({}, 'out');
    }
};
