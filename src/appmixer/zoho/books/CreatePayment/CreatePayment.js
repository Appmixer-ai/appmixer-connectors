'use strict';
const ZohoClient = require('../../ZohoClient');
const lib = require('../lib');

// Inputs sent in the request body as they are.
const BODY_FIELDS = [
    'customer_id',
    'payment_mode',
    'amount',
    'reference_number',
    'description',
    'account_id',
    'bank_charges',
    'exchange_rate'
];

/**
 * The invoices the payment is applied to: the Invoices JSON when set, else the single
 * Invoice ID with Amount Applied (defaulting to the whole payment amount).
 * @param {*} context
 * @param {Object} input
 * @returns {Array<Object>}
 */
function buildInvoices(context, input) {

    const invoices = lib.parseJsonInput(context, input.invoices, 'Invoices');
    if (invoices !== undefined) {
        if (!Array.isArray(invoices) || !invoices.length) {
            throw new context.CancelError('Invoices must be a non-empty JSON array.');
        }
        return invoices;
    }
    if (!input.invoiceId) {
        throw new context.CancelError('Invoice ID or Invoices is required!');
    }
    const applied = input.amountApplied;
    return [{
        invoice_id: input.invoiceId,
        amount_applied: applied === undefined || applied === null || applied === '' ? input.amount : applied
    }];
}

/**
 * Record a customer payment and apply it to invoices: POST /customerpayments.
 * @see https://www.zoho.com/books/api/v3/customer-payments/#create-a-payment
 */
module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.customerId) {
            throw new context.CancelError('Customer ID is required!');
        }
        if (!input.paymentMode) {
            throw new context.CancelError('Payment Mode is required!');
        }
        if (input.amount === undefined || input.amount === null || input.amount === '') {
            throw new context.CancelError('Amount is required!');
        }
        if (!input.date) {
            throw new context.CancelError('Payment Date is required!');
        }

        const data = lib.pickDefined(input, BODY_FIELDS);
        data.date = lib.formatDate(input.date);
        data.invoices = buildInvoices(context, input);

        const zc = new ZohoClient(context);
        const { payment } = await zc.request('POST', '/books/v3/customerpayments', {
            data,
            params: { organization_id: input.organizationId }
        });

        return context.sendJson(payment || {}, 'out');
    }
};
