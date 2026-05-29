'use strict';

module.exports = {

    async receive(context) {

        const {
            id, name, amount,
            currency_code: currencyCode,
            expected_close: expectedClose,
            deal_stage_id: dealStageId,
            deal_pipeline_id: dealPipelineId,
            probability,
            owner_id: ownerId,
            contacts_added_list: contactsAddedList,
            contacts_removed_list: contactsRemovedList
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Deal ID is required!');
        }

        const dealData = {
            name, amount,
            currency_code: currencyCode,
            expected_close: expectedClose,
            deal_stage_id: dealStageId,
            deal_pipeline_id: dealPipelineId,
            probability,
            owner_id: ownerId
        };

        // Remove undefined/null/empty values
        Object.keys(dealData).forEach(key => {
            if (dealData[key] === undefined || dealData[key] === null || dealData[key] === '') {
                delete dealData[key];
            }
        });

        // Handle contact lists
        if (contactsAddedList) {
            dealData.contacts_added_list = contactsAddedList
                .split(',')
                .map(i => parseInt(i.trim(), 10))
                .filter(i => !isNaN(i));
        }
        if (contactsRemovedList) {
            dealData.contacts_removed_list = contactsRemovedList
                .split(',')
                .map(i => parseInt(i.trim(), 10))
                .filter(i => !isNaN(i));
        }

        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://${context.auth.domain}/api/deals/${id}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: { deal: dealData }
        });

        return context.sendJson(data.deal, 'out');
    }
};
