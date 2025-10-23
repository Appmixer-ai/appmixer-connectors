'use strict';

module.exports = {

    async receive(context) {

        const {
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

        if (!clientId) {
            throw new context.CancelError('Client ID is required!');
        }

        const body = {
            client_id: clientId
        };

        if (subject !== undefined && subject !== null) {
            body.subject = subject;
        }

        if (number !== undefined && number !== null) {
            body.number = number;
        }

        if (issueDate !== undefined && issueDate !== null) {
            body.issue_date = issueDate;
        }

        if (dueDate !== undefined && dueDate !== null) {
            body.due_date = dueDate;
        }

        if (paymentTerm !== undefined && paymentTerm !== null) {
            body.payment_term = paymentTerm;
        }

        if (purchaseOrder !== undefined && purchaseOrder !== null) {
            body.purchase_order = purchaseOrder;
        }

        if (notes !== undefined && notes !== null) {
            body.notes = notes;
        }

        if (currency !== undefined && currency !== null) {
            body.currency = currency;
        }

        if (tax !== undefined && tax !== null) {
            body.tax = tax;
        }

        if (tax2 !== undefined && tax2 !== null) {
            body.tax2 = tax2;
        }

        if (discount !== undefined && discount !== null) {
            body.discount = discount;
        }

        if (estimateId !== undefined && estimateId !== null) {
            body.estimate_id = estimateId;
        }

        if (retainerId !== undefined && retainerId !== null) {
            body.retainer_id = retainerId;
        }

        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.harvestapp.com/v2/invoices',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Harvest-Account-Id': context.auth.accountId,
                'User-Agent': 'Appmixer (info@appmixer.ai)',
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson(responseData, 'out');
    }
};
