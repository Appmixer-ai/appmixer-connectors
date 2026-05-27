'use strict';

module.exports = {
    async receive(context) {
        const {
            contactId,
            name,
            dayOfCycle,
            campaignId,
            note,
            scoring,
            customFieldId,
            customFieldValue,
            tagId
        } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        // Build request body with only provided fields
        const body = {};

        if (name !== undefined) {
            body.name = name;
        }

        if (dayOfCycle !== undefined) {
            body.dayOfCycle = dayOfCycle;
        }

        if (campaignId !== undefined) {
            body.campaign = {
                campaignId: campaignId
            };
        }

        if (note !== undefined) {
            body.note = note;
        }

        if (scoring !== undefined) {
            body.scoring = scoring;
        }

        if (customFieldId !== undefined && customFieldValue !== undefined) {
            body.customFieldValues = [
                {
                    customFieldId: customFieldId,
                    value: [customFieldValue]
                }
            ];
        }

        if (tagId !== undefined) {
            body.tags = [
                {
                    tagId: tagId
                }
            ];
        }

        // https://apireference.getresponse.com/#operation/updateContact
        await context.httpRequest({
            method: 'POST',
            url: `https://api.getresponse.com/v3/contacts/${contactId}`,
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: body
        });

        return context.sendJson({ contactId }, 'out');
    }
};
