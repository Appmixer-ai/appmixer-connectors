'use strict';

/**
 * Items of an expression field with levels ["AND"] as an array of strings.
 * The Designer stores the rows as { AND: [{ <field>_item: 'value' }, ...] }; a plain array is accepted too.
 * @param {object|Array|string} value
 * @param {string} itemField Name of the row field, e.g. 'tags_item'.
 * @returns {string[]}
 */
function getExpressionItems(value, itemField) {

    if (value === undefined || value === null || value === '') {
        return [];
    }
    let items;
    if (Array.isArray(value)) {
        items = value;
    } else if (typeof value === 'object') {
        items = (Array.isArray(value.AND) ? value.AND : []).map(row => row?.[itemField]);
    } else {
        items = [value];
    }
    return items
        .filter(item => item !== undefined && item !== null && item !== '')
        .map(item => String(item).trim())
        .filter(Boolean);
}

module.exports = {
    async receive(context) {

        const {
            first_name: firstName,
            last_name: lastName,
            email,
            mobile_number: mobileNumber,
            work_number: workNumber,
            job_title: jobTitle,
            website,
            address,
            city,
            state,
            country,
            zipcode,
            custom_field: customField,
            sales_accounts: salesAccounts,
            tags
        } = context.messages.in.content;

        if (!firstName) {
            throw new context.CancelError('First Name is required!');
        }

        // Build the contact object
        const contactData = {
            first_name: firstName,
            last_name: lastName,
            email,
            mobile_number: mobileNumber,
            work_number: workNumber,
            job_title: jobTitle,
            website,
            address,
            city,
            state,
            country,
            zipcode,
            custom_field: customField
        };

        // Remove undefined/null values
        Object.keys(contactData).forEach(key => {
            if (contactData[key] === undefined || contactData[key] === null) {
                delete contactData[key];
            }
        });

        // https://developers.freshworks.com/crm/api/#create_contact
        // sales_accounts is an array of hashes: [{ "id": 1, "is_primary": true }, { "id": 2, "is_primary": false }].
        // The first account entered becomes the primary one.
        const salesAccountIds = getExpressionItems(salesAccounts, 'sales_accounts_item');
        if (salesAccountIds.length) {
            contactData.sales_accounts = salesAccountIds.map((id, index) => ({
                id: /^\d+$/.test(id) ? Number(id) : id,
                is_primary: index === 0
            }));
        }
        const tagList = getExpressionItems(tags, 'tags_item');
        if (tagList.length) {
            contactData.tags = tagList;
        }

        const { domain, apiKey } = context.auth;

        const response = await context.httpRequest({
            method: 'POST',
            url: `https://${domain}/api/contacts`,
            headers: {
                'Authorization': `Token token=${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: {
                contact: contactData
            }
        });

        return context.sendJson(response.data.contact, 'out');
    }
};
