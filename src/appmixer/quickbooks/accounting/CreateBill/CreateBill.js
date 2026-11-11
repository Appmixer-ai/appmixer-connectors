'use strict';
const { makeRequest, logDeprecatedMinorVersion } = require('../../commons');

const isSet = (value) => value !== undefined && value !== null && value !== '';

module.exports = {

    async receive(context) {

        const {
            vendorId,
            minorVersion,
            lineItemsJSON,
            currency,
            dueDate,
            ...optionalInputs
        } = context.messages.in.content;

        if (!isSet(vendorId)) {
            throw new context.CancelError('Vendor ID is required!');
        }
        if (!isSet(lineItemsJSON)) {
            throw new context.CancelError('Line Items JSON is required!');
        }

        // Log warning for deprecated minor versions
        await logDeprecatedMinorVersion(context, minorVersion);

        let lineItems = [];
        try {
            lineItems = JSON.parse(lineItemsJSON);
        } catch (error) {
            throw new context.CancelError('Invalid JSON for line items. Details: ' + error.message);
        }

        /** Linked transactions */
        let linkedTxn = [];
        try {
            linkedTxn = JSON.parse(optionalInputs['linkedTxnJSON'] || '[]');
        } catch (error) {
            throw new context.CancelError('Invalid JSON for linkedTxn. Details: ' + error.message);
        }

        const data = {
            VendorRef: {
                value: vendorId
            },
            Line: lineItems,
            DueDate: dueDate,
            TxnDate: optionalInputs['txnDate'],
            DocNumber: optionalInputs['docNumber'],
            PrivateNote: optionalInputs['privateNote'],
            LinkedTxn: linkedTxn
        };

        // Optional references are sent only when set. An empty reference (e.g. `"CurrencyRef": {}`)
        // is rejected by QuickBooks on multicurrency companies (error 2410); when omitted, the bill
        // inherits the vendor's currency and the company defaults.
        const refs = {
            CurrencyRef: currency,
            APAccountRef: optionalInputs['apAccountId'],
            SalesTermRef: optionalInputs['salesTermId'],
            DepartmentRef: optionalInputs['departmentId']
        };
        for (const [field, value] of Object.entries(refs)) {
            if (isSet(value)) {
                data[field] = { value };
            }
        }
        if (isSet(optionalInputs['exchangeRate'])) {
            data.ExchangeRate = optionalInputs['exchangeRate'];
        }

        const options = {
            path: `v3/company/${context.profileInfo.companyId}/bill?minorversion=${minorVersion}`,
            method: 'POST',
            data
        };
        const response = await makeRequest({ context, options });
        return context.sendJson(response.data?.Bill, 'out');
    }
};
