'use strict';
const { sparseUpdate } = require('../../commons');

const isSet = value => value !== undefined && value !== null && value !== '';

// Input name -> top-level Customer field.
const SIMPLE_FIELDS = {
    displayName: 'DisplayName',
    title: 'Title',
    givenName: 'GivenName',
    middleName: 'MiddleName',
    familyName: 'FamilyName',
    suffix: 'Suffix',
    companyName: 'CompanyName',
    printOnCheckName: 'PrintOnCheckName',
    notes: 'Notes'
};

// Input name -> BillAddr field.
const ADDRESS_FIELDS = {
    billAddrLine1: 'Line1',
    billAddrCity: 'City',
    billAddrCountrySubDivisionCode: 'CountrySubDivisionCode',
    billAddrPostalCode: 'PostalCode',
    billAddrCountry: 'Country'
};

/**
 * Fields to send in the sparse update. The billing address is merged into the current one,
 * so changing e.g. only the city keeps the street and postal code.
 */
const buildChanges = (content, current = {}) => {

    const changes = {};

    for (const [input, field] of Object.entries(SIMPLE_FIELDS)) {
        if (isSet(content[input])) changes[field] = content[input];
    }
    if (isSet(content.primaryEmailAddrAddress)) changes.PrimaryEmailAddr = { Address: content.primaryEmailAddrAddress };
    if (isSet(content.primaryPhoneFreeFormNumber)) {
        changes.PrimaryPhone = { FreeFormNumber: content.primaryPhoneFreeFormNumber };
    }
    if (isSet(content.mobileFreeFormNumber)) changes.Mobile = { FreeFormNumber: content.mobileFreeFormNumber };
    if (isSet(content.webAddrURI)) changes.WebAddr = { URI: content.webAddrURI };

    const address = {};
    for (const [input, field] of Object.entries(ADDRESS_FIELDS)) {
        if (isSet(content[input])) address[field] = content[input];
    }
    if (Object.keys(address).length) {
        changes.BillAddr = { ...current.BillAddr, ...address };
    }

    return changes;
};

module.exports = {

    async receive(context) {

        const content = context.messages.in.content;
        const customerId = isSet(content.customerId) ? String(content.customerId) : '';

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }
        if (Object.keys(buildChanges(content)).length === 0) {
            throw new context.CancelError('Nothing to update. Fill in at least one field to change.');
        }

        await sparseUpdate(context, 'Customer', customerId, current => buildChanges(content, current));

        await context.sendJson({}, 'out');
    }
};
