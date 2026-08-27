'use strict';

module.exports = {

    async receive(context) {

        const {
            deal_name: dealName,
            deal_amount: dealAmount,
            currency_code: currencyCode,
            expected_close: expectedClose,
            stage_id: stageId,
            owner_id: ownerId,
            sales_account_id: salesAccountId,
            sales_account_name: salesAccountName,
            contacts_list: contactsList,
            tags,
            custom_fields: customFields
        } = context.messages.in.content;

        if (!dealName) {
            throw new context.CancelError('Deal Name is required!');
        }

        if (!dealAmount) {
            throw new context.CancelError('Deal Amount is required!');
        }

        // Build the deal object
        const dealData = {
            deal: {
                name: dealName,
                amount: dealAmount
            }
        };

        if (currencyCode) dealData.deal.currency_code = currencyCode;
        if (expectedClose) dealData.deal.expected_close = expectedClose;
        if (stageId) dealData.deal.deal_stage_id = stageId;
        if (ownerId) dealData.deal.owner_id = ownerId;
        if (salesAccountId) dealData.deal.sales_account_id = salesAccountId;

        if (salesAccountName) {
            dealData.deal.sales_account = { name: salesAccountName };
        }

        if (contactsList) {
            const contactsArray = typeof contactsList === 'string'
                ? contactsList.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
                : Array.isArray(contactsList) ? contactsList : [];
            if (contactsArray.length > 0) {
                dealData.deal.contacts_added_list = contactsArray;
            }
        }

        if (tags) {
            const tagsArray = typeof tags === 'string'
                ? tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                : Array.isArray(tags) ? tags : [];
            if (tagsArray.length > 0) {
                dealData.deal.tags = tagsArray;
            }
        }

        if (customFields && typeof customFields === 'object') {
            dealData.deal.custom_field = customFields;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://${context.auth.domain}/api/deals`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: dealData
        });

        return context.sendJson(data.deal, 'out');
    }
};
