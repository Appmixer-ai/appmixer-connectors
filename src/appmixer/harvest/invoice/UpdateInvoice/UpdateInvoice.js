'use strict';

module.exports = {

    async receive(context) {

        const {
            invoiceId,
            clientId,
            subject,
            number,
            issueDate,
            dueDate,
            paymentTerm,
            purchaseOrder,
            notes,
            currency,
            tax,
            tax2,
            discount,
            estimateId,
            retainerId
        } = context.messages.in.content;

        if (!invoiceId) {
            throw new context.CancelError('Invoice ID is required!');
        }

        const data = {};

        if (clientId !== undefined && clientId !== null) {
            data.client_id = clientId;
        }

        if (subject !== undefined && subject !== null) {
            data.subject = subject;
        }

        if (number !== undefined && number !== null) {
            data.number = number;
        }

        if (issueDate !== undefined && issueDate !== null) {
            data.issue_date = issueDate;
        }

        if (dueDate !== undefined && dueDate !== null) {
            data.due_date = dueDate;
        }

        if (paymentTerm !== undefined && paymentTerm !== null) {
            data.payment_term = paymentTerm;
        }

        if (purchaseOrder !== undefined && purchaseOrder !== null) {
            data.purchase_order = purchaseOrder;
        }

        if (notes !== undefined && notes !== null) {
            data.notes = notes;
        }

        if (currency !== undefined && currency !== null) {
            data.currency = currency;
        }

        if (tax !== undefined && tax !== null) {
            data.tax = tax;
        }

        if (tax2 !== undefined && tax2 !== null) {
            data.tax2 = tax2;
        }

        if (discount !== undefined && discount !== null) {
            data.discount = discount;
        }

        if (estimateId !== undefined && estimateId !== null) {
            data.estimate_id = estimateId;
        }

        if (retainerId !== undefined && retainerId !== null) {
            data.retainer_id = retainerId;
        }

        if (Object.keys(data).length === 0) {
            throw new context.CancelError('At least one field to update is required!');
        }

        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.harvestapp.com/v2/invoices/${invoiceId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Harvest-Account-Id': context.auth.accountId,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Content-Type': 'application/json'
            },
            data: data
        });

        return context.sendJson({}, 'out');
    }
};
