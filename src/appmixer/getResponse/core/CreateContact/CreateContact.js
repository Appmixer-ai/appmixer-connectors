'use strict';

module.exports = {
    async receive(context) {
        const {
            email,
            name,
            campaignId,
            dayOfCycle,
            ipAddress,
            note,
            scoring,
            customFieldId,
            customFieldValue,
            tagId
        } = context.messages.in.content;

        // Validate required inputs
        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        // Build request body
        const body = {
            email,
            campaign: {
                campaignId
            }
        };

        // Add optional fields if provided
        if (name) {
            body.name = name;
        }

        if (dayOfCycle !== undefined && dayOfCycle !== null) {
            body.dayOfCycle = dayOfCycle;
        }

        if (ipAddress) {
            body.ipAddress = ipAddress;
        }

        if (note) {
            body.note = note;
        }

        if (scoring !== undefined && scoring !== null) {
            body.scoring = scoring;
        }

        if (customFieldId && customFieldValue) {
            body.customFieldValues = [
                {
                    customFieldId,
                    value: Array.isArray(customFieldValue) ? customFieldValue : [customFieldValue]
                }
            ];
        }

        if (tagId) {
            body.tags = [
                {
                    tagId
                }
            ];
        }

        // https://apireference.getresponse.com/#contacts
        // Note: The API returns 202 Accepted with no body, only a Location header
        await context.httpRequest({
            method: 'POST',
            url: 'https://api.getresponse.com/v3/contacts',
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: body
        });

        // The API returns 202 Accepted with no body.
        // Echo back the input values for reference.
        // To get the contactId, use FindContacts with email filter after this component.
        const result = {
            email,
            name: name || null,
            campaignId
        };

        return context.sendJson(result, 'out');
    }
};
