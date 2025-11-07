'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { customerId, method, consumerName, consumerAccount, consumerBic, signatureDate, mandateReference, paypalBillingAgreementId, testmode } = context.messages.in.content;

        // Validate required inputs
        if (!customerId) {
            throw new context.CancelError('Customer Id is required!');
        }
        if (!method) {
            throw new context.CancelError('Method is required!');
        }

        const requestData = {
            method: method
        };

        // For directdebit mandates
        if (method === 'directdebit') {
            if (consumerName) {
                requestData.consumerName = consumerName;
            }
            if (consumerAccount) {
                requestData.consumerAccount = consumerAccount;
            }
            if (consumerBic) {
                requestData.consumerBic = consumerBic;
            }
            if (signatureDate) {
                requestData.signatureDate = signatureDate;
            }
            if (mandateReference) {
                requestData.mandateReference = mandateReference;
            }
        }

        // For PayPal mandates
        if (method === 'paypal') {
            if (paypalBillingAgreementId) {
                requestData.paypalBillingAgreementId = paypalBillingAgreementId;
            }
            if (mandateReference) {
                requestData.mandateReference = mandateReference;
            }
        }

        if (testmode) {
            requestData.testmode = testmode;
        }

        // https://docs.mollie.com/reference/v2/mandates-api/create-mandate
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.mollie.com/v2/customers/${customerId}/mandates`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
